namespace CourseWork.Models;

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

[BsonIgnoreExtraElements]
public class RegistrationRequest
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement("userName")]
    public string UserName { get; set; }

    [BsonElement("passwordHash")]
    public string PasswordHash { get; set; }

    [BsonElement("fullName")]
    public string? FullName { get; set; }

    [BsonElement("phone")]
    public string? Phone { get; set; }

    [BsonElement("address")]
    public string? Address { get; set; }

    [BsonElement("status")]
    [BsonRepresentation(BsonType.String)]
    public RequestStatus Status { get; set; } = RequestStatus.Pending;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public RegistrationRequest(string userName, string password)
    {
        Id = ObjectId.GenerateNewId().ToString();
        UserName = userName;
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        Status = RequestStatus.Pending;
    }
}

public enum RequestStatus
{
    Pending,
    Approved,
    Rejected
}
