const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// Spins up a real (but in-memory, disposable) MongoDB for tests, so we
// exercise actual Mongoose queries instead of mocking the database away.
async function connect() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

async function closeDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}

async function clearDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connect, closeDatabase, clearDatabase };
