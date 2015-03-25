# Server Part

Two main functions

  1. Handle HTTP request
* Get next page (`pathname=='/color'`). The response is image url.
* Like/Dislike (`pathname=='/like' or '/dislike'`).
  2. Interact with database
* Fetch image information from database
* Update vote column in database.

Implemented in Node.js
