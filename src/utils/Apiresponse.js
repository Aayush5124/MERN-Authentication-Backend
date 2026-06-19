// this is a custom response class.
// used to send a consistent response structure from every API.

class ApiResponse {

    constructor(
        statusCode, // HTTP status code (200, 201, 404, 500 etc.)
        data,       // actual data we want to send
        message = "Success" // default message
    ) {

        // store status code

        this.statusCode = statusCode;

        // store response data

        this.data = data;

        // store response message

        this.message = message;

        // if status code is less than 400
        // request is considered successful

        this.success = statusCode < 400;
    }
}

// export class

export default ApiResponse;
// its just a another class for the send() in the api resonsose if i need to use it we do it liek ../apirespose/send()  as api resonse work of my is already done.

        // send() {
        //     return this.res.status(this.statusCode).json({
        //         success: this.success,
        //         message: this.message,
        //         data: this.data
        //     });
        // }
