import { jest, describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import { app } from "../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "../services/schemas/schema";
import * as authServices from "../services/auth.js";
import dotenv from "dotenv";

dotenv.config();

const tempDb = await MongoMemoryServer.create();
const tempDbUri = tempDb.getUri();

const connectToTempDb = async () => {
  await mongoose.connect(tempDbUri, {
    useNewUrlParser: true,
    retryWrites: true,
  });
};

const disconnectTempDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

describe("Test POST Method  singup", () => {
  beforeAll(async () => {
    await connectToTempDb();
  });

  afterAll(async () => {
    await disconnectTempDb();
  });

  test.each([
    { email: "test@gmail.com", password: "test", expected: 201 },
    { email: "test@gmail.com", password: "test", expected: 409 },
  ])(
    "Should register the same email",
    async ({ email, password, expected }) => {
      const response = await request(app)
        .post("/api/users/singup")
        .send({ email, password });
      expect(response.statusCode).toBe(expected);
    }
  );

  test.each([
    { email: "test1@gmail.com", password: "test", expected: 201 },
    { email: "test2@gmail.com", password: "test", expected: 201 },
  ])("Should return email and sub", async ({ email, password, expected }) => {
    const response = await request(app)
      .post("/api/users/singup")
      .send({ email, password });
    expect(response.statusCode).toBe(expected);
    expect(response.body.email).toBe(email);
    expect(response.body.subscription).toBe("starter");
  });

  test.each([
    {
      email: "test1@gmail.com",
      password: "t",
      expected:
        '"password" with value "t" fails to match the required pattern: /^[a-zA-Z0-9]{3,30}$/',
    },
    {
      email: "tsjad.com.pl",
      password: "test",
      expected: '"email" must be a valid email',
    },
  ])(
    "Should validate email and password",
    async ({ email, password, expected }) => {
      const response = await request(app)
        .post("/api/users/singup")
        .send({ email, password });
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(expected);
    }
  );
});

describe("Test POST Method  login", () => {
  beforeAll(async () => {
    await connectToTempDb();

    await request(app)
      .post("/api/users/singup")
      .send({ email: "test@gmail.com", password: "test" });
    await request(app)
      .post("/api/users/singup")
      .send({ email: "Admin@gmail.com", password: "Admin" });
  });

  afterAll(async () => {
    await disconnectTempDb();
  });

  test.each([
    {
      email: "testgmail.com",
      password: "test",
      expected: 400,
      expectedMessage: `\"email\" must be a valid email`,
    },
    {
      email: "Admin@gmail.com",
      password: "A",
      expected: 400,
      expectedMessage: `\"password\" with value \"A\" fails to match the required pattern: /^[a-zA-Z0-9]{3,30}$/`,
    },
  ])(
    "Should  validate password or login",
    async ({ email, password, expected, expectedMessage }) => {
      const response = await request(app)
        .post("/api/users/login")
        .send({ email, password });
      expect(response.statusCode).toBe(expected);
      expect(response.body.message).toBe(expectedMessage);
    }
  );

  test.each([
    {
      email: "test@gmail.com",
      password: "wrong",
      expected: 401,
      expectedMessage: "Email or password is wrong ",
    },
    {
      email: "AdminWrong@gmail.com",
      password: "bad",
      expected: 400,
      expectedMessage: "The user does not exist ",
    },
  ])(
    "Should retrun unauthorization",
    async ({ email, password, expected, expectedMessage }) => {
      const response = await request(app)
        .post("/api/users/login")
        .send({ email, password });
      expect(response.statusCode).toBe(expected);
      expect(response.body.message).toBe(expectedMessage);
    }
  );

  test.each([
    {
      email: "test@gmail.com",
      password: "test",
      expected: 200,
    },
    {
      email: "Admin@gmail.com",
      password: "Admin",
      expected: 200,
    },
  ])("Should login", async ({ email, password, expected }) => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email, password });
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.subscription).toBe("starter");
    expect(response.body.user.id).toHaveLength(24);
    expect(response.body.token).toBeTruthy();
    expect(response.statusCode).toBe(expected);
  });
});
