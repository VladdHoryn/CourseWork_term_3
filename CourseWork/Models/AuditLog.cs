using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CourseWork.Models;

public class AuditLog
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; }
    public string UserName { get; set; }

    public string Action { get; set; }    
    public string Details { get; set; }
}