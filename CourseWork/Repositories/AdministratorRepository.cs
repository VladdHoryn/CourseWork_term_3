using MongoDB.Driver;
using Сoursework.Models;
using Сoursework.Repositories;

namespace CourseWork.Repositories;

public class AdministratorRepository : UserRepository
{
    public AdministratorRepository(MongoDBRepository db): base(db) {}

    public List<User> GetAllAdmins() =>
        Users.Find(u => u.UserRole == Role.Administrator).ToList();

    public void DeleteUserById(string id)
    {
        Users.DeleteOne(u => u.Id == id);
    }
}