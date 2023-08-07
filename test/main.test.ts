function importTests(name: string, path: string) {
  describe(name, function () {
    import(path);
  });
}

describe('API tests', function () {
  importTests('App', './app.test.ts');
  importTests('Users', './users/users.test.ts');
  importTests('Trips', './trips/trips.test.ts'); //could be improved
  importTests('Reviews', './reviews/reviews.test.ts'); //could be improved
  importTests('Buses', './buses/buses.test.ts');
  importTests('Cities', './cities/cities.test.ts');
  importTests('Tickets', './tickets/tickets.test.ts');
});
