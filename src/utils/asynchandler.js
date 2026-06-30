const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(
            requestHandler(req, res, next)
        ).catch(next);
    };
};

export { asyncHandler };
export default asyncHandler;


// this is a async handler function that will be used to handle all the async functions in the controllers. It will catch the errors and send the response to the client. This will help us to avoid writing try-catch block in every controller function.

// const asynchandler = (fn) => {
//     return async (req, res, next) => {
//         try {
//             await fn(req, res, next);  
//         } catch (err) {
//             res.status(500).json({ message: err.message });
//         }
//     }
// }

// export default asynchandler