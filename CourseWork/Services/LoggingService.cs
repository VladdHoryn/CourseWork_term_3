using CourseWork.Models;
using MongoDB.Driver;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class LoggingService
{
    private readonly IMongoCollection<AuditLog> _logs;

    public LoggingService(MongoDBRepository repo)
    {
        _logs = repo.GetCollection<AuditLog>("AuditLogs");
    }

    public void Log(string userId, string username, string action, string details)
    {
        var log = new AuditLog
        {
            UserId = userId,
            UserName = username,
            Action = action,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _logs.InsertOne(log);
    }

    public List<AuditLog> GetAllLogs()
    {
        return _logs.Find(_ => true)
            .SortByDescending(l => l.Timestamp)
            .ToList();
    }
}