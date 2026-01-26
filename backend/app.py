from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from werkzeug.security import check_password_hash
#from models import User  # sql model

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your-secret-key"

jwt = JWTManager(app)

def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400
    #
    email = data["email"]
    password = data["password"]

    
    # Look up user by email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # verify password
    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    #generate token
    access_token = create_access_token(identity=user.id)

    
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200