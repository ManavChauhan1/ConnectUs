const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid Email"),
    username: z.string().min(3, "Username too short"),
    age: z.coerce.number().int().min(13, "Must be at least 13"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

module.exports = {registerSchema}