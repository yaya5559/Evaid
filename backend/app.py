from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token
from werkzeug.security import check_password_hash
#from services.evidence_services import EvidenceService # adding this to connect our new AI evidence brain to the app
from services.loginSevices import get_user_by_email, verify_password # import our SQL functions for checking users and password
#from models import User  # sql model

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your-secret-key"

jwt = JWTManager(app)

# setting up our connection to the AI Evidence database
# this is basically the "brain" for the evidence part of our project
#evidence_brain = EvidenceService()

# we run this so the container is created automatically when the server starts
#with app.app_context():
    #evidence_brain.create_container_with_ai_policy()

@app.route("/login", methods=["POST"]) 
def login():
    data = request.get_json()

    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Email and password are required"}), 400
    #
    email = data["email"]
    password = data["password"]

    
    # Look up user by email
    #user = User.query.filter_by(email=email).first()

    # Use our SQL helper function instead of User.query
    user = get_user_by_email(email)

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    # verify password
    # We use our custom verify_password function because it knows how to read bcrypt
    if not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid credentials"}), 401

    #generate token
    access_token = create_access_token(identity=user.id)

    
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.first_name,
            "email": email,
            "role": user.role
        }
    }), 200

@app.route("/upload-evidence", methods=["POST"])
def upload_evidence():
    # get the JSON data from the frontend
    data = request.get_json()
    
    # call our Cosmos service to save everything
    # this will convert the summary to a vector and store it in the Evidence container
    evidence_brain.save_new_evidence(
        caseId=data.get("caseId"),
        userId=data.get("userId"),
        fileName=data.get("fileName"),
        fileUrl=data.get("fileUrl"),           # link to where file is in Blob Storage
        summary=data.get("summary"),           # AI summary that gets turned into a vector
        extractedText=data.get("extractedText", ""),  # OCR text if there is any
        metadata=data.get("metadata", {})      # extra info like GPS coordinates
    )
    
    return jsonify({"message": "Evidence successfully saved to the AI Brain!"}), 201


@app.route("/search-connections", methods=["GET"])
def search_connections():
    # get whatever the user typed in the search box
    query = request.args.get("query")
    
    # use vector search to find similar evidence files
    # this searches by meaning not just keywords
    results = evidence_brain.find_similar_evidence(query)
    
    return jsonify({"results": results}), 200

if __name__ == "__main__":
    app.run(debug=True)
