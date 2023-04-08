import { ERROR_TYPE } from "./constant.js";
import Joi from "joi";

export const isContactTaken = (body, contactList) => {
  const { name, email, phone } = body;

  const isTaken = contactList.filter(
    (element) =>
      element.name === name &&
      element.email === email &&
      element.phone === phone
  );

  if (isTaken?.length) throw new Error(ERROR_TYPE.CONTACT_TAKEN);
};

export const isReqPostBodyOk = (body) => {
  const { name, email, phone } = body;
  const condition = name && email && phone;
  if (!condition) return false;
  return true;
};

export const validationSchema = Joi.object({
  name: Joi.string().pattern(/^[a-zA-Z]+ [a-zA-Z]+$/),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})$/),
});