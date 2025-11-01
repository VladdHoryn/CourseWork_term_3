using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class AdministratorRepository
{
    private readonly IMongoCollection<User> _users;

    public AdministratorRepository(MongoDBRepository db)
    {
        _users = db.GetCollection<User>("users");
    }

    public List<User> GetAllAdmins() =>
        _users.Find(u => u.UserRole == Role.Administrator).ToList();

    public void DeleteUserById(string id)
    {
        _users.DeleteOne(u => u.Id == id);
    }
}