// Custom Error Class
// Used to create consistent API errors throughout the project

class ApiError extends Error {
    constructor(
        statusCode,                    // HTTP status code (404, 500, etc.)
        message = "Something went wrong",
        errors = [],                   // Array of additional errors
        stack = ""                     // Optional custom stack trace
    ) {

        // Call parent Error constructor
        // This sets the error message
        super(message);

        // Custom properties

        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        // If custom stack is provided, use it

        if (stack) {
            this.stack = stack;
        } else {

            // Creates a clean stack trace
            // Removes constructor call from stack

            Error.captureStackTrace(
                this,
                this.constructor
            );
        }
    }
}

// Export class

export default ApiError;