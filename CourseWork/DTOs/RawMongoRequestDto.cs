using MongoDB.Bson;

namespace CourseWork.DTOs;

public class RawMongoQueryRequestDto
{
    public string CollectionName { get; set; }
    public string Operation { get; set; } // "find", "insert", "update", "delete"
    public BsonDocument Filter { get; set; } = new();
    public BsonDocument Document { get; set; } = new(); // для insert або update
}
