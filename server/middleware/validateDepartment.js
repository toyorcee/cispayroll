const departmentSchema = Joi.object({
  name: Joi.string().required().trim(),
  code: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  location: Joi.string().required().trim(),
  headOfDepartment: Joi.string(), 
});
