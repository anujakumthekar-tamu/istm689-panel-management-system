"""Main application file for the PMS Core API."""

import boto3
import uuid
from chalice import Chalice, AuthResponse, CORSConfig, NotFoundError, BadRequestError
from chalicelib.config import (
    ENV,
    GOOGLE_AUTH_CLIENT_ID,
    ALLOW_ORIGIN,
    ALLOWED_AUTHORIZATION_TYPES,
    USER_TABLE_NAME,
    QUESTION_TABLE_NAME,
)
from chalicelib.constants import BOTO3_DYNAMODB_TYPE, REQUEST_CONTENT_TYPE_JSON
from chalicelib import db
from google.auth import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import datetime


app = Chalice(app_name=f"{ENV}-pms-core")
_USER_DB = None
_QUESTION_DB = None


def get_user_db():
    global _USER_DB
    try:
        if _USER_DB is None:
            _USER_DB = db.DynamoUserDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(USER_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _USER_DB


def get_question_db():
    global _QUESTION_DB
    try:
        if _QUESTION_DB is None:
            _QUESTION_DB = db.DynamoQuestionDB(
                boto3.resource(BOTO3_DYNAMODB_TYPE).Table(QUESTION_TABLE_NAME)
            )
    except Exception as e:
        return {"error": str(e)}
    return _QUESTION_DB


def dummy():
    """
    Collection of all functions that we need.
    The sole purpose is to force Chalice to generate the right permissions in the policy.
    Does nothing and returns nothing.
    """
    # DynamoDB
    dummy_db = boto3.client("dynamodb")
    dummy_db.get_item()
    dummy_db.put_item()
    dummy_db.update_item()
    dummy_db.scan()
    dummy_db.query()
    # S3
    # dummy_s3 = boto3.client("s3")
    # dummy_s3.put_object()
    # dummy_s3.download_file()
    # dummy_s3.get_object()
    # dummy_s3.list_objects_v2()
    # dummy_s3.get_bucket_location()


app.api.cors = CORSConfig(
    allow_origin=ALLOW_ORIGIN,
)


@app.authorizer()
def google_oauth2_authorizer(auth_request):
    """
    Lambda function to check authorization of incoming requests.
    """
    allowed_routes = []
    principal_id = "unspecified"
    try:
        # Expects token in the "Authorization" header of incoming request
        # ---> Format: "{"Authorization": "Bearer <token>"}"
        # ---> Format: "{"Authorization": "Basic <token>"}"
        # Extract the token from the incoming request
        auth_header = auth_request.token.split()
        auth_token_type = auth_header[0]
        # Check if authorization type is valid
        if auth_token_type not in ALLOWED_AUTHORIZATION_TYPES:
            app.log.error(f"Invalid Authorization Header Type: {auth_token_type}")
            raise ValueError("Could not verify authorization type")
        # Extract the token from the authorization header
        token = auth_header[1]

        match auth_token_type:
            case "Bearer":
                request = requests.Request()
                # Validate the JWT token using Google's OAuth2 v2 API
                id_info = id_token.verify_oauth2_token(
                    token, request, GOOGLE_AUTH_CLIENT_ID
                )
                allowed_routes.append("*")
                principal_id = id_info["sub"]

            case "Basic":
                # Decode Basic token and return allowed routes
                # I'm thinking using panel@email.com:current-date
                pass
            case _:
                raise ValueError("Invalid Authorization Header Type")

    except exceptions.GoogleAuthError as e:
        # Token is invalid
        app.log.error(f"Google Auth Error: {str(e)}")
    except Exception as e:
        # General catch statement for unexpected errors
        app.log.error(f"Unexpected Error: {str(e)}")
    # Single return for all cases
    return AuthResponse(routes=allowed_routes, principal_id=principal_id)


@app.route("/")
def index():
    """Index route, only for testing purposes."""

    # Workaround to force chalice to generate all policies
    # It never executes
    if False:
        dummy()
    return {"API": app.app_name}


@app.route(
    "/question",
    methods=["GET"],
    authorizer=google_oauth2_authorizer,
)
def get_all_questions():
    """
    Question route, testing purposes.
    """

    try:
        return get_question_db().list_questions()
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/question/{id}",
    methods=["GET"],
    authorizer=google_oauth2_authorizer,
)
def get_question(id):
    """
    Question route, testing purposes.
    """
    item = get_question_db().get_question(question_id=id)
    if item is None:
        raise NotFoundError("Question (%s) not found" % id)
    return item


@app.route(
    "/question",
    methods=["POST"],
    authorizer=google_oauth2_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_question():
    """Question route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body

        # Check for all required fields
        if "question" not in incoming_json:
            raise BadRequestError("Key 'question' not found in incoming request")

        # Fetch principalID (Google ID) from incoming request.
        google_id = app.current_request.context["authorizer"]["principalId"]
        # TODO: Add user db get UserID by GoogleID... It will be easier for us later on
        origin_ip = app.current_request.context["identity"]["sourceIp"]
        # Build Question object for database
        new_question = dict()
        new_question["QuestionID"] = str(uuid.uuid4())
        new_question["GoogleID"] = google_id
        new_question["OriginIP"] = origin_ip
        new_question["CreatedAt"] = datetime.now().isoformat()
        new_question["Question"] = incoming_json["question"]
        get_question_db().add_question(new_question)
        # Returns the result of put_item, kind of metadata and stuff
        return {"message": "Question successfully inserted in the DB", "QuestionID": new_question["QuestionID"]}

    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/user",
    methods=["GET"],
    authorizer=google_oauth2_authorizer,
)
def get_all_users():
    """
    User route, testing purposes.
    """

    try:
        return get_user_db().list_users()
    except Exception as e:
        return {"error": str(e)}


@app.route(
    "/user/{id}",
    methods=["GET"],
    authorizer=google_oauth2_authorizer,
)
def get_user(id):
    """
    User route, testing purposes.
    """
    item = get_user_db().get_user(user_id=id)
    if item is None:
        raise NotFoundError("User (%s) not found" % id)
    return item


@app.route(
    "/user",
    methods=["POST"],
    authorizer=google_oauth2_authorizer,
    content_types=[REQUEST_CONTENT_TYPE_JSON],
)
def add_new_user():
    """User route, testing purposes."""
    try:
        """`app.current_request.json_body` works because the request has the header `Content-Type: application/json` set."""
        incoming_json = app.current_request.json_body

        # Check for all required fields
        if "name" not in incoming_json:
            raise BadRequestError("Key 'name' not found in incoming request")
        if "lastname" not in incoming_json:
            raise BadRequestError("Key 'lastname' not found in incoming request")
        if "email" not in incoming_json:
            raise BadRequestError("Key 'email' not found in incoming request")

        # Fetch principalID (Google ID) from incoming request.
        # Not a real case scenario
        google_id = app.current_request.context["authorizer"]["principalId"]
        origin_ip = app.current_request.context["identity"]["sourceIp"]
        # Build User object for database
        new_user = dict()
        new_user["UserID"] = str(uuid.uuid4())
        new_user["GoogleID"] = google_id
        new_user["OriginIP"] = origin_ip
        new_user["CreatedAt"] = datetime.now().isoformat()
        new_user["Name"] = incoming_json["name"]
        new_user["LastName"] = incoming_json["lastname"]
        new_user["Email"] = incoming_json["email"]

        get_user_db().add_user(new_user)
        # Returns the result of put_item, kind of metadata and stuff

    except Exception as e:
        return {"error": str(e)}
