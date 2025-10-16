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
}