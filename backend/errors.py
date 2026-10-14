from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from models.pydantic.common import ErrorDetail, ErrorResponse


class APIError(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        self.status_code = status_code
        self.code = code
        self.message = message


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    body = ErrorResponse(error=ErrorDetail(code=code, message=message))
    return JSONResponse(status_code=status_code, content=body.model_dump())


def handle_api_error(request: Request, exception: APIError):
    return error_response(exception.status_code, exception.code, exception.message)


def handle_validation_error(request: Request, exception: RequestValidationError):
    error = exception.errors()[0]
    location = error["loc"]
    field = ".".join(str(part) for part in location[1:]) or location[0]

    if error["type"] == "json_invalid":
        return error_response(400, "invalid_body", "Request body is not valid JSON")
    if location[0] == "body":
        return error_response(422, "invalid_body", f"'{field}': {error['msg']}")

    return error_response(400, "invalid_parameter", f"'{field}': {error['msg']}")


def handle_http_error(request: Request, exception: StarletteHTTPException):
    code = "not_found" if exception.status_code == 404 else "http_error"
    return error_response(exception.status_code, code, str(exception.detail))


def handle_unexpected_error(request: Request, exception: Exception):
    return error_response(500, "internal_error", "Unexpected server error")


def register_error_handlers(app: FastAPI):
    app.add_exception_handler(APIError, handle_api_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, handle_http_error)
    app.add_exception_handler(Exception, handle_unexpected_error)
