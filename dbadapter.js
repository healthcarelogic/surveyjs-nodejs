var pgp = require("pg-promise")(/*options*/);

var db;

function PostgresDBAdapter() {
  if (!db) {
    db = pgp(process.env.DATABASE_URL || "postgres://postgres:123456@localhost:5432/surveyjs");
  }

  function getObjectFromStorage(tableName, callback) {
    db.any("SELECT * FROM " + tableName).then(function (result) {
      var objects = {};
      (result || []).forEach(function (item) {
        objects[item.id] = item;
      });
      callback(objects);
    });
  }

  function addSurvey(name, callback) {
    db
      .one("INSERT INTO surveys (name, json) VALUES($1, $2) RETURNING *", [
        name,
        "{}"
      ])
      .then(callback);
  }

  function postResults(postId, json, callback) {
    db
      .one("INSERT INTO results (postid, json) VALUES($1, $2) RETURNING *", [
        postId,
        json
      ])
      .then(callback);
  }

  function getResults(postId, callback) {
    db
      .any("SELECT * FROM results WHERE postid=$1", [postId])
      .then(function (data) {
        //console.log(JSON.stringify(data));
        var results = (data || []).map(function (item) {
          return item["json"];
        });
        callback(results);
      });
  }

  function deleteSurvey(surveyId, callback) {
    db
      .one("DELETE FROM surveys WHERE id=$1 RETURNING *", [surveyId])
      .then(callback);
  }

  function changeName(id, name, callback) {
    console.log("THIS IS THE NAME: " + name + " ID: " + id);
    db
      .one("UPDATE surveys SET name = $1 WHERE id = $2 RETURNING *", [name, id])
      .then(callback);
  }

  function storeSurvey(id, json, callback) {
    db
      .one("UPDATE surveys SET json = $1 WHERE id = $2 RETURNING *", [json, id])
      .then(callback);
  }

  function getSurveys(callback) {
    getObjectFromStorage("surveys", function (objects) {
      callback(objects);
    });
  }

  return {
    addSurvey: addSurvey,
    getSurvey: function (surveyId, callback) {
      getSurveys(function (result) {
        callback(JSON.parse(result[surveyId].json));
      });
    },
    storeSurvey: storeSurvey,
    getSurveys: getSurveys,
    deleteSurvey: deleteSurvey,
    postResults: postResults,
    getResults: getResults,
    changeName: changeName
  };
}

module.exports = PostgresDBAdapter;
