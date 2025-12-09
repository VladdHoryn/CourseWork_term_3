# --------------------------
# 1) BUILD STAGE
# --------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

# --------------------------
# 2) RUNTIME STAGE
# --------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# копіюємо published файли
COPY --from=build /app/publish .

# ASP.NET слухає 8080
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "CourseWork.dll"]
