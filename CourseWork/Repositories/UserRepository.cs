using MongoDB.Driver;
using Сoursework.Models;

namespace Сoursework.Repositories;

public class UserRepository
{
    protected readonly IMongoCollection<User> Users;
    protected readonly IMongoCollection<Visit> Visits;

    public UserRepository(MongoDBRepository db)
    {
        Users = db.GetCollection<User>("users");
        Visits = db.GetCollection<Visit>("visits");
    }
    
    //  Existing basic CRUD methods
    public List<User> GetAllUsers()
    {
        return Users.Find(_ => true).ToList();
    }
    
    public void CreateUser(User user)
    {
        Users.InsertOne(user);
    }
    
    public User GetUserByName(string username)
    {
        return Users.Find(u => u.UserName == username).FirstOrDefault();
    }
    
    public void UpdatePassword(string username, string newPassword)
    {
        var filter = Builders<User>.Filter.Eq(u => u.UserName, username);
        var update = Builders<User>.Update.Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword(newPassword));
        Users.UpdateOne(filter, update);
    }
    
    public void UpdateUser(User updatedUser)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, updatedUser.Id);
        Users.ReplaceOne(filter, updatedUser);
    }
    
    public void DeleteUser(string username)
    {
        Users.DeleteOne(u => u.UserName == username);
    }
}
