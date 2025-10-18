using Сoursework.Models;
using Сoursework.Repositories;

namespace Сoursework.Services;

public class VisitService
{
    private readonly VisitRepository _visitRepo;

    public VisitService(VisitRepository visitRepo)
    {
        _visitRepo = visitRepo;
    }

    public List<Visit> GetAllVisits()
    {
        try
        {
            return _visitRepo.GetAllVisits();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Could not fetch visits: {ex.Message}");
            return new List<Visit>();
        }
    }

    public Visit GetVisitById(string id)
    {
        try
        {
            var visit = _visitRepo.GetVisitById(id);
            if (visit == null)
                throw new KeyNotFoundException($"Visit with ID {id} not found.");
            return visit;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetVisitById failed: {ex.Message}");
            throw;
        }
    }

    public bool CreateVisit(Visit visit)
    {
        try
        {
            if (!visit.IsValid())
                throw new ArgumentException("Visit data is invalid.");

            _visitRepo.CreateVisit(visit);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] Failed to create visit: {ex.Message}");
            return false;
        }
    }

    public bool UpdateVisit(string id, Visit updatedVisit)
    {
        try
        {
            var existing = _visitRepo.GetVisitById(id);
            if (existing == null)
                throw new KeyNotFoundException($"Visit {id} not found.");

            _visitRepo.UpdateVisit(id, updatedVisit);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] UpdateVisit failed: {ex.Message}");
            return false;
        }
    }

    public bool DeleteVisit(string id)
    {
        try
        {
            _visitRepo.DeleteVisit(id);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] DeleteVisit failed: {ex.Message}");
            return false;
        }
    }

    public decimal GetPatientTotalCostByYear(int recordNumber, int year)
    {
        try
        {
            return _visitRepo.GetPatientTotalCostByYear(recordNumber, year);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Error] GetPatientTotalCostByYear failed: {ex.Message}");
            return 0;
        }
    }
}
