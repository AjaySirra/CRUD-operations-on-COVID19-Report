const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const InitializeDBandServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server is Running on http://localhost:3000");
  });
};
InitializeDBandServer();

const convertdbToState = (dbObject) => ({
  stateId: dbObject.state_id,
  stateName: dbObject.state_name,
  population: dbObject.population,
});

const convertdbToDistrict = (dbObject) => ({
  districtId: dbObject.district_id,
  districtName: dbObject.district_name,
  stateId: dbObject.state_id,
  cases: dbObject.cases,
  cured: dbObject.cured,
  active: dbObject.active,
  deaths: dbObject.deaths,
});

//GET States
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT *
        FROM state
        ORDER BY state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((eachState) => convertdbToState(eachState)));
});

//GET States By Id
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateidQuery = `
    SELECT *
    FROM state
    WHERE state_id=${stateId};`;
  const stateArray = await db.get(stateidQuery);
  response.send(convertdbToState(stateArray));
});

//POST District
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDetailsQuery = `
        INSERT INTO district 
        (district_name,state_id,cases,cured,active,deaths)
        VALUES('${districtName}',${stateId},${cases},${cured},
        ${active},${deaths});`;
  await db.run(postDetailsQuery);
  response.send("District Successfully Added");
});

//GET District details by district_id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id=${districtId};`;
  const districtDetails = await db.get(getDistrictQuery);
  response.send(convertdbToDistrict(districtDetails));
});

//Delete District by district_id
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM 
        district 
        WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//Update district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
        UPDATE district
        SET 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        WHERE district_id=${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//GET statistics
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statsQuery = `
        SELECT SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
        FROM district
        WHERE state_id=${stateId};`;
  const statsDetails = await db.get(statsQuery);
  response.send({
    totalCases: statsDetails["SUM(cases)"],
    totalCured: statsDetails["SUM(cured)"],
    totalActive: statsDetails["SUM(active)"],
    totalDeaths: statsDetails["SUM(deaths)"],
  });
});

//GET stateName of a District
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
        SELECT state_name AS stateName
        FROM state INNER JOIN district
        ON state.state_id=district.state_id
        WHERE district_id=${districtId}`;
  const stateName = await db.get(stateNameQuery);
  response.send(stateName);
});

module.exports = app;
