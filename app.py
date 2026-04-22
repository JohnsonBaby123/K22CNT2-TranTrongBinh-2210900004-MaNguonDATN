from flask import Flask, render_template, request, redirect, jsonify
import mysql.connector
import json

app = Flask(__name__)

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
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        # TODO: Xử lý đăng nhập (kiểm tra DB, tạo session, ...)
        return redirect("/")
    return render_template("login.html")

# 📝 Trang đăng ký
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        username = request.form.get("username")
        password = request.form.get("password")
        # TODO: Xử lý đăng ký (kiểm tra email/username, hash password, lưu DB, ...)
        return redirect("/login")
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