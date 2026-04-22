from flask import Flask, render_template, request, redirect, jsonify, session, url_for
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
    # Nếu đã đăng nhập thì điều hướng theo vai trò
    if 'user_id' in session:
        if session.get('role') == 'admin':
            return redirect("/admin/dashboard")
        next_url = request.args.get("next")
        if next_url and next_url.startswith("/"):
            return redirect(next_url)
        return redirect("/")

    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
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
                role = str(user.get('role', '')).strip().lower()
                session['role'] = role
                
                next_url = request.form.get("next") or request.args.get("next")

                # Nếu là admin, chuyển hướng tới admin dashboard
                if role == 'admin':
                    return redirect("/admin/dashboard")
                else:
                    if next_url and next_url.startswith("/"):
                        return redirect(next_url)
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

        cursor.execute("SELECT id, name FROM Category ORDER BY name")
        categories = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template(
            "admin/products.html",
            products=products,
            categories=categories,
            username=session['username']
        )
    except Exception as e:
        return f"Lỗi: {str(e)}"


@app.route("/admin/products/add", methods=["POST"])
@admin_required
def admin_add_product():
    try:
        name = request.form.get("name", "").strip()
        price = float(request.form.get("price", 0) or 0)
        category_id = int(request.form.get("category_id", 0) or 0)
        stock = int(request.form.get("stock", 0) or 0)
        image = request.form.get("image", "").strip()
        description = request.form.get("description", "").strip()

        if not name or category_id <= 0:
            return redirect("/admin/products")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO product (name, price, description, category_id, image, stock)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (name, price, description, category_id, image or None, stock)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return redirect("/admin/products")
    except Exception:
        return redirect("/admin/products")


@app.route("/admin/products/<int:product_id>/edit", methods=["POST"])
@admin_required
def admin_edit_product(product_id):
    try:
        name = request.form.get("name", "").strip()
        price = float(request.form.get("price", 0) or 0)
        category_id = int(request.form.get("category_id", 0) or 0)
        stock = int(request.form.get("stock", 0) or 0)
        image = request.form.get("image", "").strip()
        description = request.form.get("description", "").strip()

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE product
            SET name=%s, price=%s, description=%s, category_id=%s, image=%s, stock=%s
            WHERE id=%s
            """,
            (name, price, description, category_id, image or None, stock, product_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return redirect("/admin/products")
    except Exception:
        return redirect("/admin/products")


@app.route("/admin/products/<int:product_id>/delete", methods=["POST"])
@admin_required
def admin_delete_product(product_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM product WHERE id = %s", (product_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return redirect("/admin/products")
    except Exception:
        return redirect("/admin/products")

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
def admin_update_order_status(order_id):
    try:
        status = request.form.get("status", "").strip()
        allowed_status = {"pending", "processing", "completed", "cancelled"}
        if status not in allowed_status:
            return redirect("/admin/orders")

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE OrderTable SET status = %s WHERE id = %s",
            (status, order_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return redirect("/admin/orders")
    except Exception:
        return redirect("/admin/orders")


@app.route("/admin/orders/<int:order_id>/delete", methods=["POST"])
@admin_required
def admin_delete_order(order_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM OrderDetail WHERE order_id = %s", (order_id,))
        cursor.execute("DELETE FROM Payment WHERE order_id = %s", (order_id,))
        cursor.execute("DELETE FROM OrderTable WHERE id = %s", (order_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return redirect("/admin/orders")
    except Exception:
        return redirect("/admin/orders")

# 📝 Trang đăng ký
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = (request.form.get("email") or "").strip()
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        confirm_password = request.form.get("confirm_password") or ""

        if not email or not username or not password:
            return render_template("register.html", error="Vui lòng nhập đầy đủ thông tin bắt buộc")

        if password != confirm_password:
            return render_template("register.html", error="Mật khẩu xác nhận không khớp")

        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("SELECT id FROM User WHERE email = %s LIMIT 1", (email,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return render_template("register.html", error="Email đã được sử dụng")

            cursor.execute("SELECT id FROM User WHERE username = %s LIMIT 1", (username,))
            if cursor.fetchone():
                cursor.close()
                conn.close()
                return render_template("register.html", error="Tên đăng nhập đã tồn tại")

            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO User (username, password, email, role)
                VALUES (%s, %s, %s, %s)
                """,
                (username, password, email, "user")
            )
            conn.commit()
            cursor.close()
            conn.close()

            return redirect("/login")
        except Exception as e:
            return render_template("register.html", error=f"Lỗi: {str(e)}")
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

# 💳 Trang thanh toán
@app.route("/checkout")
def checkout():
    # Chỉ user đã đăng nhập mới được vào trang thanh toán
    if 'user_id' not in session:
        return redirect(url_for("login", next=request.full_path.rstrip("?")))
    if session.get('role') != 'user':
        return redirect("/")
    return render_template("checkout.html")

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
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM product WHERE category_id = %s", (category_id,))
        products_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return render_template("products.html", category_name=category_name, products=products_list)
    
    except Exception as e:
        return f"Lỗi kết nối DB: {e}"

# 💾 API đặt hàng từ trang checkout
@app.route("/api/checkout", methods=["POST"])
def create_order():
    if 'user_id' not in session or session.get('role') != 'user':
        return jsonify({"error": "Bạn cần đăng nhập tài khoản user để thanh toán"}), 401

    try:
        data = request.get_json(silent=True) or {}
        raw_items = data.get("items", [])
        if not raw_items:
            return jsonify({"error": "Không có sản phẩm để thanh toán"}), 400

        # Gộp số lượng theo product_id để tránh trùng
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

        # Lấy giá + tồn kho thực từ DB để tính đơn hàng chính xác
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
            order_items.append(
                {
                    "product_id": product_id,
                    "quantity": quantity,
                    "price": float(product["price"])
                }
            )

        # Tạo đơn hàng
        cursor.execute(
            """
            INSERT INTO OrderTable (user_id, total_price, status)
            VALUES (%s, %s, %s)
            """,
            (session["user_id"], total_price, "pending")
        )
        order_id = cursor.lastrowid

        # Tạo chi tiết đơn + trừ kho
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

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "order_id": order_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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