using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Сoursework.Models;
using Сoursework.Services;

namespace CourseWork.Controllers;

[Route("specialist")]
[Authorize]
public class SpecialistController : Controller
{
    private readonly SpecialistService _specialistService;
    private readonly VisitService _visitService;
    private readonly PatientService _patientService;

    public SpecialistController(
        SpecialistService specialistService,
        VisitService visitService,
        PatientService patientService)
    {
        _specialistService = specialistService;
        _visitService = visitService;
        _patientService = patientService;
    }

    // -------------------- DASHBOARD --------------------
    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        var specialistId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (specialistId is null)
            return RedirectToAction("Login", "Auth");

        var visits = _visitService.GetAllVisits()
            .Where(v => v.SpecialistId == specialistId)
            .OrderBy(v => v.VisitDate)
            .ToList();

        return Ok(new
        {
            Today = visits.Where(v => v.VisitDate.Date == DateTime.Today),
            Week = visits.Where(v => v.VisitDate.Date <= DateTime.Today.AddDays(7))
        });
    }

    // -------------------- VISITS LIST --------------------
    [HttpGet("visits")]
    public IActionResult Visits(string? patientSearch, DateTime? dateFrom, DateTime? dateTo)
    {
        var specialistId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (specialistId is null)
            return Unauthorized();

        var visits = _visitService.GetAllVisits()
            .Where(v => v.SpecialistId == specialistId);

        if (!string.IsNullOrWhiteSpace(patientSearch))
        {
            var patients = _patientService.SearchBySurname(patientSearch);
            var recordNumbers = patients
                .Where(p => p.MedicalRecordNumber != null)
                .Select(p => p.MedicalRecordNumber.Value)
                .ToList();

            visits = visits.Where(v => recordNumbers.Contains(v.PatientMedicalRecord));
        }

        if (dateFrom != null) visits = visits.Where(v => v.VisitDate >= dateFrom);
        if (dateTo != null) visits = visits.Where(v => v.VisitDate <= dateTo);

        return Ok(visits.OrderByDescending(v => v.VisitDate).ToList());
    }

    // -------------------- ADD VISIT --------------------
    [HttpPost("visits/add")]
    public IActionResult AddVisit(
        string patientId,
        DateTime visitDate,
        string status,
        bool isFirstVisit,
        string anamnesis,
        string diagnosis,
        string treatment,
        string? recommendations,
        decimal serviceCost,
        decimal medicationCost)
    {
        var specialistId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (specialistId is null) return Unauthorized();

        var patient = _patientService.GetById(patientId);
        if (patient?.MedicalRecordNumber is null)
        {
            TempData["Error"] = "Invalid patient medical record.";
            return RedirectToAction("Visits");
        }

        var visit = new Visit(
            patient.MedicalRecordNumber.Value,
            specialistId,
            visitDate,
            Enum.Parse<VisitStatus>(status),
            isFirstVisit,
            anamnesis,
            diagnosis,
            treatment,
            recommendations,
            serviceCost,
            medicationCost
        );

        var success = _visitService.CreateVisit(visit);
        if (!success)
            TempData["Error"] = "Failed to create visit.";

        return RedirectToAction("Visits");
    }

    // -------------------- UPDATE VISIT --------------------
    [HttpPost("visits/update/{id}")]
    public IActionResult UpdateVisit(
        string id,
        string anamnesis,
        string diagnosis,
        string treatment,
        string? recommendations,
        decimal serviceCost,
        decimal medicationCost,
        string status)
    {
        Visit? visit;

        try
        {
            visit = _visitService.GetVisitById(id);
        }
        catch
        {
            return NotFound("Visit not found.");
        }

        if (!visit.CanBeModified())
        {
            TempData["Error"] = "This visit cannot be modified.";
            return RedirectToAction("Visits");
        }

        visit.UpdateMedicalInfo(anamnesis, diagnosis, treatment, recommendations);
        visit.SetCosts(serviceCost, medicationCost);
        visit.SetStatus_string(status);

        var success = _visitService.UpdateVisit(id, visit);
        if (!success)
            TempData["Error"] = "Failed to update visit.";

        return RedirectToAction("Visits");
    }

    // -------------------- DELETE VISIT --------------------
    [HttpPost("visits/delete/{id}")]
    public IActionResult DeleteVisit(string id)
    {
        Visit? visit;
        try { visit = _visitService.GetVisitById(id); }
        catch { return NotFound("Visit not found."); }

        if (visit.Status == VisitStatus.Completed)
        {
            TempData["Error"] = "Completed visits cannot be deleted.";
            return RedirectToAction("Visits");
        }

        var success = _visitService.DeleteVisit(id);
        if (!success)
            TempData["Error"] = "Failed to delete visit.";

        return RedirectToAction("Visits");
    }

    // -------------------- STATISTICS --------------------
    [HttpGet("statistics")]
    public IActionResult Statistics(DateTime? startDate, DateTime? endDate)
    {
        var specialistId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var visits = _visitService.GetAllVisits()
            .Where(v => v.SpecialistId == specialistId);

        if (startDate != null) visits = visits.Where(v => v.VisitDate >= startDate);
        if (endDate != null) visits = visits.Where(v => v.VisitDate <= endDate);

        var list = visits.ToList();

        var avgPerDay = list
            .GroupBy(v => v.VisitDate.Date)
            .Select(g => g.Count())
            .DefaultIfEmpty(0)
            .Average();

        var revenue = list.Sum(v => v.TotalCost);

        return Ok(new
        {
            AvgPatientsPerDay = Math.Round(avgPerDay, 2),
            Revenue = revenue
        });
    }
}