const constants = require('./constants.js');
const AWS = require ('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const db = new AWS.DynamoDB();

(async function() {
  const tables = await db.listTables({}).promise();
  if (tables.TableNames.some(i => i === constants.TABLE_NAME)) {
    console.log('Target table is already exists. So, Delete it before creation.');
    try {
      await db.deleteTable({ TableName: constants.TABLE_NAME }).promise();
      await db.waitFor('tableNotExists', { TableName: constants.TABLE_NAME }).promise();
    } catch(e) {
      console.error(e);
    }
  }
  const params = {
    TableName: constants.TABLE_NAME,
    KeySchema: [
      { AttributeName: "podcastId", KeyType: "HASH" }
    ],
    AttributeDefinitions: [
      { AttributeName: "podcastId", AttributeType: "S" }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  };
  try {
    await db.createTable(params).promise();
    await db.waitFor('tableExists', { TableName: constants.TABLE_NAME }).promise();
  } catch(e) {
    console.error(e);
  }
})();
