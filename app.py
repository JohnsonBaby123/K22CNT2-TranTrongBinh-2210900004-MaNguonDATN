from flask import Flask, render_template, request, redirect, jsonify, session, flash
import mysql.connector
import json
from functools import wraps

app = Flask(__name__)
app.secret_key = "your_secret_key_here_2024"  # Thay đổi thành secret key an toàn

# 🔌 Kết nối MySQL
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="123456",  
        database="BinhSport"
    )


def ensure_user_profile_columns():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'User'
        """
    )
    existing_columns = {row[0] for row in cursor.fetchall()}

    columns_to_add = [
        ("first_name", "VARCHAR(50) NULL AFTER id"),
        ("last_name", "VARCHAR(50) NULL AFTER first_name"),
        ("phone", "VARCHAR(20) NULL AFTER last_name"),
    ]

    for column_name, column_definition in columns_to_add:
        if column_name not in existing_columns:
            cursor.execute(f"ALTER TABLE User ADD COLUMN {column_name} {column_definition}")

    conn.commit()
    cursor.close()
    conn.close()


def get_or_create_cart(cursor, user_id):
    cursor.execute("SELECT id FROM Cart WHERE user_id = %s ORDER BY id ASC LIMIT 1", (user_id,))
    cart = cursor.fetchone()

    if cart:
        return cart[0] if isinstance(cart, tuple) else cart['id']

    cursor.execute("INSERT INTO Cart (user_id) VALUES (%s)", (user_id,))
    return cursor.lastrowid


def serialize_cart_items(cursor, cart_id):
    cursor.execute(
        """
        SELECT ci.product_id, ci.quantity, p.name, p.price, p.image
        FROM CartItem ci
        INNER JOIN Product p ON ci.product_id = p.id
        WHERE ci.cart_id = %s
        ORDER BY ci.id ASC
        """,
        (cart_id,)
    )

    items = []
    subtotal = 0
    total_quantity = 0

    for row in cursor.fetchall():
        if isinstance(row, dict):
            product_id = row["product_id"]
            quantity = row["quantity"]
            name = row["name"]
            price = float(row["price"])
            image = row["image"]
        else:
            product_id = row[0]
            quantity = row[1]
            name = row[2]
            price = float(row[3])
            image = row[4]

        items.append({
            "id": product_id,
            "quantity": quantity,
            "name": name,
            "price": price,
            "image": image,
        })
        total_quantity += quantity
        subtotal += price * quantity

    return items, total_quantity, subtotal

# 🏠 Trang chủ
@app.route("/")
def home():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM product")
        products = cursor.fetchall()

        cursor.close()
        conn.close()

        return render_template("index.html", products=products)

    except Exception as e:
        return f"Lỗi kết nối DB: {e}"

# 🔑 Trang đăng nhập
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET" and 'user_id' in session:
        next_url = request.args.get("next", "")
        if next_url and next_url.startswith("/"):
            return redirect(next_url)
        if session.get('role') == 'admin':
            return redirect("/admin/dashboard")
        return redirect("/")

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        next_url = request.form.get("next") or request.args.get("next", "")
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Kiểm tra tài khoản bằng email hoặc username
            cursor.execute(
                "SELECT * FROM User WHERE (email = %s OR username = %s) AND password = %s",
                (email, email, password)
            )
            user = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if user:
                # Lưu thông tin user vào session
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['email'] = user['email']
                session['role'] = user['role']
                
                # Nếu là admin, chuyển hướng tới admin dashboard
                if user['role'] == 'admin':
                    return redirect("/admin/dashboard")
                if next_url and next_url.startswith("/"):
                    return redirect(next_url)
                else:
                    return redirect("/")
            else:
                return render_template("login.html", error="Email/tên đăng nhập hoặc mật khẩu không chính xác")
        
        except Exception as e:
            return render_template("login.html", error=f"Lỗi: {str(e)}")
    
    return render_template("login.html")

# 🚪 Trang đăng xuất
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

# 🔒 Decorator để check admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

# 📊 Trang Admin Dashboard
@app.route("/admin/dashboard")
@admin_required
def admin_dashboard():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Lấy thống kê
        cursor.execute("SELECT COUNT(*) as total FROM product")
        total_products = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM User WHERE role = 'user'")
        total_users = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM OrderTable")
        total_orders = cursor.fetchone()['total']
        
        cursor.execute("SELECT SUM(total_price) as total FROM OrderTable")
        result = cursor.fetchone()
        total_revenue = result['total'] if result['total'] else 0
        
        # Lấy danh sách sản phẩm
        cursor.execute("SELECT p.*, c.name as category_name FROM product p LEFT JOIN Category c ON p.category_id = c.id ORDER BY p.id DESC LIMIT 10")
        products = cursor.fetchall()
        
        # Lấy danh sách đơn hàng gần đây
        cursor.execute("""
            SELECT o.*, u.username FROM OrderTable o 
            LEFT JOIN User u ON o.user_id = u.id 
            ORDER BY o.created_at DESC LIMIT 5
        """)
        orders = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("admin/dashboard.html", 
            total_products=total_products,
            total_users=total_users,
            total_orders=total_orders,
            total_revenue=total_revenue,
            products=products,
            orders=orders,
            username=session['username']
        )
    except Exception as e:
        return f"Lỗi: {str(e)}"

# 📦 Trang Quản lý Sản phẩm
@app.route("/admin/products")
@admin_required
def admin_products():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT p.*, c.name as category_name FROM product p 
            LEFT JOIN Category c ON p.category_id = c.id
            ORDER BY p.id DESC
        """)
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("admin/products.html", products=products, username=session['username'])
    except Exception as e:
        return f"Lỗi: {str(e)}"

# 👥 Trang Quản lý Người dùng
@app.route("/admin/users")
@admin_required
def admin_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM User WHERE role = 'user' ORDER BY id DESC")
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("admin/users.html", users=users, username=session['username'])
    except Exception as e:
        return f"Lỗi: {str(e)}"

# 📋 Trang Quản lý Đơn hàng
@app.route("/admin/orders")
@admin_required
def admin_orders():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT o.*, u.username, u.email FROM OrderTable o 
            LEFT JOIN User u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        """)
        orders = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("admin/orders.html", orders=orders, username=session['username'])
    except Exception as e:
        return f"Lỗi: {str(e)}"


@app.route("/admin/orders/<int:order_id>/status", methods=["POST"])
@admin_required
def update_order_status(order_id):
    allowed_statuses = {"pending", "processing", "completed", "cancelled"}
    status = request.form.get("status", "").strip().lower()

    if status not in allowed_statuses:
        flash("Trạng thái đơn hàng không hợp lệ.", "error")
        return redirect("/admin/orders")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM OrderTable WHERE id = %s", (order_id,))
        order = cursor.fetchone()

        if not order:
            cursor.close()
            conn.close()
            flash("Không tìm thấy đơn hàng để cập nhật.", "error")
            return redirect("/admin/orders")

        cursor.execute(
            "UPDATE OrderTable SET status = %s WHERE id = %s",
            (status, order_id)
        )
        conn.commit()

        cursor.close()
        conn.close()

        flash("Đã lưu trạng thái đơn hàng.", "success")
        return redirect("/admin/orders")

    except Exception as e:
        flash(f"Lỗi khi lưu trạng thái: {str(e)}", "error")
        return redirect("/admin/orders")


@app.route("/admin/orders/<int:order_id>/delete", methods=["POST"])
@admin_required
def delete_order(order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM OrderTable WHERE id = %s", (order_id,))
        order = cursor.fetchone()

        if not order:
            cursor.close()
            conn.close()
            flash("Không tìm thấy đơn hàng để xóa.", "error")
            return redirect("/admin/orders")

        cursor.execute("DELETE FROM Payment WHERE order_id = %s", (order_id,))
        cursor.execute("DELETE FROM OrderDetail WHERE order_id = %s", (order_id,))
        cursor.execute("DELETE FROM OrderTable WHERE id = %s", (order_id,))
        conn.commit()

        cursor.close()
        conn.close()

        flash("Đã xóa đơn hàng.", "success")
        return redirect("/admin/orders")

    except Exception as e:
        flash(f"Lỗi khi xóa đơn hàng: {str(e)}", "error")
        return redirect("/admin/orders")

# 📝 Trang đăng ký
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        first_name = request.form.get("first_name", "").strip()
        last_name = request.form.get("last_name", "").strip()
        email = request.form.get("email", "").strip().lower()
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        phone = request.form.get("phone", "").strip()

        if not all([first_name, last_name, email, username, password, confirm_password]):
            return render_template("register.html", error="Vui lòng nhập đầy đủ thông tin bắt buộc")

        if password != confirm_password:
            return render_template("register.html", error="Mật khẩu xác nhận không khớp")

        try:
            ensure_user_profile_columns()

            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute(
                "SELECT id FROM User WHERE email = %s OR username = %s",
                (email, username)
            )
            existing_user = cursor.fetchone()

            cursor.close()

            if existing_user:
                conn.close()
                return render_template("register.html", error="Email hoặc tên đăng nhập đã tồn tại")

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO User (first_name, last_name, phone, username, email, password, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (first_name, last_name, phone or None, username, email, password, "user")
            )
            conn.commit()

            cursor.close()
            conn.close()

            return render_template("login.html", message="Đăng ký thành công. Vui lòng đăng nhập.")

        except Exception as e:
            return render_template("register.html", error=f"Lỗi đăng ký: {str(e)}")
    return render_template("register.html")

# 🔐 Trang quên mật khẩu
@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email")
        # TODO: Xử lý quên mật khẩu (gửi email reset, ...)
        return render_template("login.html", message="Hướng dẫn đặt lại mật khẩu đã được gửi.")
    return render_template("forgot-password.html")

# 🛒 Trang giỏ hàng
@app.route("/cart")
def cart():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM product")
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("cart.html", products=products)
    except Exception as e:
        return f"Lỗi kết nối DB: {e}"


@app.route("/api/cart", methods=["GET"])
def api_get_cart():
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"items": [], "count": 0, "subtotal": 0}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cart_id = get_or_create_cart(cursor, session['user_id'])
        conn.commit()

        items, count, subtotal = serialize_cart_items(cursor, cart_id)

        cursor.close()
        conn.close()

        return jsonify({"items": items, "count": count, "subtotal": subtotal})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cart/items", methods=["POST"])
def api_add_cart_item():
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"error": "Bạn cần đăng nhập tài khoản user để thao tác giỏ hàng"}), 401

    try:
        data = request.get_json(silent=True) or {}
        product_id = int(data.get("product_id", 0) or 0)
        quantity = int(data.get("quantity", 0) or 0)

        if product_id <= 0 or quantity <= 0:
            return jsonify({"error": "Dữ liệu sản phẩm không hợp lệ"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, name, price, stock FROM Product WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            cursor.close()
            conn.close()
            return jsonify({"error": "Sản phẩm không tồn tại"}), 404

        if (product["stock"] or 0) < quantity:
            cursor.close()
            conn.close()
            return jsonify({"error": "Sản phẩm không đủ tồn kho"}), 400

        cart_id = get_or_create_cart(cursor, session['user_id'])

        cursor.execute(
            "SELECT id, quantity FROM CartItem WHERE cart_id = %s AND product_id = %s",
            (cart_id, product_id)
        )
        cart_item = cursor.fetchone()

        if cart_item:
            new_quantity = cart_item["quantity"] + quantity
            if (product["stock"] or 0) < new_quantity:
                cursor.close()
                conn.close()
                return jsonify({"error": "Số lượng vượt quá tồn kho"}), 400

            cursor.execute(
                "UPDATE CartItem SET quantity = %s WHERE id = %s",
                (new_quantity, cart_item["id"])
            )
        else:
            cursor.execute(
                "INSERT INTO CartItem (cart_id, product_id, quantity) VALUES (%s, %s, %s)",
                (cart_id, product_id, quantity)
            )

        conn.commit()
        items, count, subtotal = serialize_cart_items(cursor, cart_id)
        cursor.close()
        conn.close()

        return jsonify({"success": True, "items": items, "count": count, "subtotal": subtotal})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cart/items/<int:product_id>", methods=["PATCH"])
def api_update_cart_item(product_id):
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"error": "Bạn cần đăng nhập tài khoản user để thao tác giỏ hàng"}), 401

    try:
        data = request.get_json(silent=True) or {}
        quantity = int(data.get("quantity", 0) or 0)

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cart_id = get_or_create_cart(cursor, session['user_id'])

        cursor.execute("SELECT id, stock FROM Product WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        if not product:
            cursor.close()
            conn.close()
            return jsonify({"error": "Sản phẩm không tồn tại"}), 404

        cursor.execute(
            "SELECT id FROM CartItem WHERE cart_id = %s AND product_id = %s",
            (cart_id, product_id)
        )
        cart_item = cursor.fetchone()

        if quantity <= 0:
            if cart_item:
                cursor.execute("DELETE FROM CartItem WHERE id = %s", (cart_item["id"],))
            conn.commit()
            items, count, subtotal = serialize_cart_items(cursor, cart_id)
            cursor.close()
            conn.close()
            return jsonify({"success": True, "items": items, "count": count, "subtotal": subtotal})

        if (product["stock"] or 0) < quantity:
            cursor.close()
            conn.close()
            return jsonify({"error": "Số lượng vượt quá tồn kho"}), 400

        if cart_item:
            cursor.execute(
                "UPDATE CartItem SET quantity = %s WHERE id = %s",
                (quantity, cart_item["id"])
            )
        else:
            cursor.execute(
                "INSERT INTO CartItem (cart_id, product_id, quantity) VALUES (%s, %s, %s)",
                (cart_id, product_id, quantity)
            )

        conn.commit()
        items, count, subtotal = serialize_cart_items(cursor, cart_id)
        cursor.close()
        conn.close()

        return jsonify({"success": True, "items": items, "count": count, "subtotal": subtotal})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cart/items/<int:product_id>", methods=["DELETE"])
def api_delete_cart_item(product_id):
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"error": "Bạn cần đăng nhập tài khoản user để thao tác giỏ hàng"}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cart_id = get_or_create_cart(cursor, session['user_id'])

        cursor.execute(
            "DELETE FROM CartItem WHERE cart_id = %s AND product_id = %s",
            (cart_id, product_id)
        )
        conn.commit()

        items, count, subtotal = serialize_cart_items(cursor, cart_id)
        cursor.close()
        conn.close()

        return jsonify({"success": True, "items": items, "count": count, "subtotal": subtotal})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 💳 Trang thanh toán
@app.route("/checkout")
def checkout():
    if 'user_id' not in session:
        return redirect("/login?next=/checkout")

    if session.get('role') != 'user':
        return redirect("/")

    return render_template("checkout.html")


# 💾 API đặt hàng từ trang thanh toán
@app.route("/api/checkout", methods=["POST"])
def create_order():
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"error": "Bạn cần đăng nhập tài khoản user để thanh toán"}), 401

    try:
        data = request.get_json(silent=True) or {}
        raw_items = data.get("items", [])
        payment_method = str(data.get("payment_method", "cod") or "cod").strip().lower()
        voucher_code = str(data.get("voucher_code", "") or "").strip().upper()

        if not raw_items:
            return jsonify({"error": "Không có sản phẩm để thanh toán"}), 400

        allowed_payment_methods = {"cod", "online"}
        if payment_method not in allowed_payment_methods:
            return jsonify({"error": "Phương thức thanh toán không hợp lệ"}), 400

        voucher_rates = {
            "": 0,
            "SPORT10": 0.10,
            "SPORT20": 0.20,
            "SPORT30": 0.30,
        }

        if voucher_code not in voucher_rates:
            return jsonify({"error": "Voucher không hợp lệ"}), 400

        item_qty_map = {}
        for item in raw_items:
            product_id = int(item.get("id", 0) or 0)
            quantity = int(item.get("quantity", 0) or 0)
            if product_id <= 0 or quantity <= 0:
                continue
            item_qty_map[product_id] = item_qty_map.get(product_id, 0) + quantity

        if not item_qty_map:
            return jsonify({"error": "Dữ liệu sản phẩm không hợp lệ"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        total_price = 0
        order_items = []

        for product_id, quantity in item_qty_map.items():
            cursor.execute(
                "SELECT id, price, stock FROM product WHERE id = %s",
                (product_id,)
            )
            product = cursor.fetchone()

            if not product:
                cursor.close()
                conn.close()
                return jsonify({"error": f"Sản phẩm #{product_id} không tồn tại"}), 400

            if (product.get("stock") or 0) < quantity:
                cursor.close()
                conn.close()
                return jsonify({"error": f"Sản phẩm #{product_id} không đủ tồn kho"}), 400

            line_price = float(product["price"]) * quantity
            total_price += line_price
            order_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "price": float(product["price"])
            })

        discount_rate = voucher_rates[voucher_code]
        discount_amount = round(total_price * discount_rate)
        final_total = max(total_price - discount_amount, 0)

        cursor.execute(
            """
            INSERT INTO OrderTable (user_id, total_price, status)
            VALUES (%s, %s, %s)
            """,
            (session["user_id"], final_total, "pending")
        )
        order_id = cursor.lastrowid

        for item in order_items:
            cursor.execute(
                """
                INSERT INTO OrderDetail (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item["product_id"], item["quantity"], item["price"])
            )
            cursor.execute(
                "UPDATE product SET stock = stock - %s WHERE id = %s",
                (item["quantity"], item["product_id"])
            )

        cursor.execute(
            """
            INSERT INTO Payment (order_id, method, status)
            VALUES (%s, %s, %s)
            """,
            (order_id, payment_method.upper(), "pending" if payment_method == "cod" else "processing")
        )

        cursor.execute("SELECT id FROM Cart WHERE user_id = %s ORDER BY id ASC LIMIT 1", (session["user_id"],))
        cart_row = cursor.fetchone()
        if cart_row:
            cart_id = cart_row["id"] if isinstance(cart_row, dict) else cart_row[0]
            for item in order_items:
                cursor.execute(
                    "DELETE FROM CartItem WHERE cart_id = %s AND product_id = %s",
                    (cart_id, item["product_id"])
                )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "order_id": order_id,
            "subtotal": total_price,
            "discount_amount": discount_amount,
            "total": final_total,
            "payment_method": payment_method,
            "voucher_code": voucher_code
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📦 Trang sản phẩm theo danh mục
@app.route("/products/<category_slug>")
def products(category_slug):
    try:
        # Mapping danh mục
        category_mapping = {
            "cau-long": ("Cầu lông", 1),
            "bong-ban": ("Bóng bàn", 2),
            "tennis": ("Tennis", 3),
            "pickleball": ("Pickleball", 4)
        }
        
        if category_slug not in category_mapping:
            return redirect("/")
        
        category_name, category_id = category_mapping[category_slug]
        
        # Lấy các tham số lọc
        search = request.args.get("search", "")
        min_price = request.args.get("min_price", "")
        max_price = request.args.get("max_price", "")
        min_qty = request.args.get("min_qty", "")
        max_qty = request.args.get("max_qty", "")
        sort_by = request.args.get("sort", "newest")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Build query với điều kiện lọc
        query = "SELECT * FROM product WHERE category_id = %s"
        params = [category_id]
        
        # Thêm điều kiện tìm kiếm
        if search:
            query += " AND (name LIKE %s OR description LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        # Thêm điều kiện lọc theo giá
        if min_price:
            query += " AND price >= %s"
            params.append(float(min_price))
        if max_price:
            query += " AND price <= %s"
            params.append(float(max_price))
        # Thêm điều kiện lọc theo số lượng (stock)
        try:
            if min_qty:
                min_q = int(min_qty)
            else:
                min_q = None
        except Exception:
            min_q = None

        try:
            if max_qty:
                max_q = int(max_qty)
            else:
                max_q = None
        except Exception:
            max_q = None

        if min_q is not None and max_q is not None and min_q > max_q:
            min_q, max_q = max_q, min_q

        if min_q is not None:
            if 1 <= min_q <= 99:
                query += " AND stock >= %s"
                params.append(min_q)
        if max_q is not None:
            if 1 <= max_q <= 99:
                query += " AND stock <= %s"
                params.append(max_q)
        
        # Thêm sắp xếp
        if sort_by == "price_asc":
            query += " ORDER BY price ASC"
        elif sort_by == "price_desc":
            query += " ORDER BY price DESC"
        elif sort_by == "name":
            query += " ORDER BY name ASC"
        else:
            query += " ORDER BY id DESC"
        
        cursor.execute(query, params)
        products_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("products.html", 
            category_name=category_name, 
            products=products_list,
            search=search,
            min_price=min_price,
            max_price=max_price,
            min_qty=min_qty,
            max_qty=max_qty,
            sort_by=sort_by
        )
    
    except Exception as e:
        return f"Lỗi kết nối DB: {e}"

# 🔍 Tìm kiếm sản phẩm toàn site
@app.route("/search")
def search():
    try:
        # Lấy các tham số tìm kiếm
        search = request.args.get("q", "")
        category = request.args.get("category", "all")
        min_price = request.args.get("min_price", "")
        max_price = request.args.get("max_price", "")
        min_qty = request.args.get("min_qty", "")
        max_qty = request.args.get("max_qty", "")
        sort_by = request.args.get("sort", "relevance")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Build query
        query = "SELECT p.*, c.name as category_name FROM product p LEFT JOIN Category c ON p.category_id = c.id WHERE 1=1"
        params = []
        
        # Tìm kiếm theo tên hoặc mô tả
        if search:
            query += " AND (p.name LIKE %s OR p.description LIKE %s)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param])
        
        # Lọc theo danh mục
        if category != "all":
            category_map = {
                "cau-long": 1,
                "bong-ban": 2,
                "tennis": 3,
                "pickleball": 4
            }
            if category in category_map:
                query += " AND p.category_id = %s"
                params.append(category_map[category])
        
        # Lọc theo giá
        if min_price:
            query += " AND p.price >= %s"
            params.append(float(min_price))
        if max_price:
            query += " AND p.price <= %s"
            params.append(float(max_price))

        # Lọc theo số lượng (stock)
        try:
            if min_qty:
                min_q = int(min_qty)
            else:
                min_q = None
        except Exception:
            min_q = None

        try:
            if max_qty:
                max_q = int(max_qty)
            else:
                max_q = None
        except Exception:
            max_q = None

        if min_q is not None and max_q is not None and min_q > max_q:
            min_q, max_q = max_q, min_q

        if min_q is not None:
            if 1 <= min_q <= 99:
                query += " AND p.stock >= %s"
                params.append(min_q)
        if max_q is not None:
            if 1 <= max_q <= 99:
                query += " AND p.stock <= %s"
                params.append(max_q)
        
        # Sắp xếp
        if sort_by == "price_asc":
            query += " ORDER BY p.price ASC"
        elif sort_by == "price_desc":
            query += " ORDER BY p.price DESC"
        elif sort_by == "name":
            query += " ORDER BY p.name ASC"
        else:
            query += " ORDER BY p.id DESC"
        
        cursor.execute(query, params)
        products_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("search.html", 
            products=products_list,
            search=search,
            category=category,
            min_price=min_price,
            max_price=max_price,
            min_qty=min_qty,
            max_qty=max_qty,
            sort_by=sort_by
        )
    
    except Exception as e:
        return f"Lỗi kết nối DB: {e}"

# 🔧 API: Lấy chi tiết sản phẩm
@app.route("/api/product/<int:product_id>")
def get_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM product WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if product:
            return jsonify(product)
        else:
            return jsonify({"error": "Sản phẩm không tìm thấy"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)