using MongoDB.Bson;
using MongoDB.Driver;

namespace Сoursework.Repositories;

public class MongoDBRepository
{
    private readonly IMongoDatabase _database;

    public MongoDBRepository(string connectionString, string dbName)
    {
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(dbName);
    }

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }
    
    // -------------------- RAW QUERY METHODS --------------------
    public async Task<List<BsonDocument>> ExecuteRawQueryAsync(string collectionName, BsonDocument filter)
    {
        var collection = _database.GetCollection<BsonDocument>(collectionName);
        var result = await collection.Find(filter).ToListAsync();
        return result;
    }

    public async Task<BsonDocument> InsertDocumentAsync(string collectionName, BsonDocument doc)
    {
        var collection = _database.GetCollection<BsonDocument>(collectionName);
        await collection.InsertOneAsync(doc);
        return doc;
    }

    public async Task<UpdateResult> UpdateDocumentsAsync(string collectionName, BsonDocument filter, BsonDocument update)
    {
        var collection = _database.GetCollection<BsonDocument>(collectionName);
        var updateDef = new BsonDocument("$set", update);
        return await collection.UpdateManyAsync(filter, updateDef);
    }

    public async Task<DeleteResult> DeleteDocumentsAsync(string collectionName, BsonDocument filter)
    {
        var collection = _database.GetCollection<BsonDocument>(collectionName);
        return await collection.DeleteManyAsync(filter);
    }
    
    public IMongoDatabase GetDatabase()
    {
        return _database;
    }
}