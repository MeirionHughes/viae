export enum Status{
  Continue = 100,

  Ok = 200,  
  
  BadRequest = 400,
  NotFound = 404,
  InternalError = 503,

  Next = 100,
  Done = 200,
  Error = 503
}