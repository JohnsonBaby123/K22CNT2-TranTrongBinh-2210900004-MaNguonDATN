from flask import Flask, render_template, request, redirect
import mysql.connector

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

if __name__ == "__main__":
    app.run(debug=True)