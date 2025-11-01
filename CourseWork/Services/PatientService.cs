using CourseWork.Repositories;
using Сoursework.Models;

namespace Сoursework.Services;

public class PatientService
{
    private readonly PatientRepository _repo;

    public PatientService(PatientRepository repo)
    {
        _repo = repo;
    }

    public List<User> GetAllPatients()
    {
        var patients = _repo.GetAllPatients();
        return patients.OrderBy(p => p.FullName).ToList();
    }

    public User? GetPatientByMedicalRecord(int medicalRecordNumber)
    {
        var patient = _repo.GetPatientByMedicalRecord(medicalRecordNumber);
        if (patient == null)
            Console.WriteLine($"Patient with record {medicalRecordNumber} not found.");
        return patient;
    }

    public List<User> SearchBySurname(string surname)
    {
        if (string.IsNullOrWhiteSpace(surname))
            throw new ArgumentException("Surname cannot be empty.");

        return _repo.GetBySurname(surname);
    }
    
    public List<User> GetPatientsByFilters(
        DateTime? birthDateFrom = null,
        DateTime? birthDateTo = null,
        string? specialistId = null,
        string? healthStatus = null)
    {
        var result = _repo.GetPatientsByFilters(birthDateFrom, birthDateTo, specialistId, healthStatus);
        
        if (result.Count == 0)
            Console.WriteLine("No patients found matching the filters.");

        return result;
    }
}