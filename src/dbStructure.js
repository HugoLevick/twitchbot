const dbStructure = {
  banned: [
    {
      Field: "username",
      Type: "varchar(255)",
      Null: "YES",
      Key: "PRI",
      Default: "-",
      Extra: "",
    },
  ],
  check_in: [
    {
      Field: "username",
      Type: "varchar(255)",
      Null: "NO",
      Key: "PRI",
      Default: "-",
      Extra: "",
    },
    {
      Field: "checkin",
      Type: "tinyint(1)",
      Null: "NO",
      Key: "",
      Default: "0",
      Extra: "",
    },
  ],
  tourneys: [
    {
      Field: "name",
      Type: "varchar(255)",
      Null: "NO",
      Key: "",
      Default: "-",
      Extra: "",
    },
    {
      Field: "start",
      Type: "datetime",
      Null: "NO",
      Key: "",
      Default: "CURRENT_TIMESTAMP",
      Extra: "DEFAULT_GENERATED",
    },
    {
      Field: "finish",
      Type: "datetime",
      Null: "NO",
      Key: "",
      Default: "CURRENT_TIMESTAMP",
      Extra: "DEFAULT_GENERATED",
    },
    {
      Field: "prize",
      Type: "int unsigned",
      Null: "NO",
      Key: "",
      Default: "0",
      Extra: "",
    },
    {
      Field: "entry",
      Type: "int unsigned",
      Null: "NO",
      Key: "",
      Default: "0",
      Extra: "",
    },
    {
      Field: "people",
      Type: "json",
      Null: "NO",
      Key: "",
      Default: "_utf8mb4\\'{}\\'",
      Extra: "DEFAULT_GENERATED",
    },
  ],
  version: [
    {
      Field: "version",
      Type: "varchar(20)",
      Null: "NO",
      Key: "",
      Default: "1.0",
      Extra: "",
    },
  ],
};

export default dbStructure;
