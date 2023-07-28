function importTests(name: string, path: string) {
  describe(name, function () {
    import(path);
  });
}

describe('API tests', function () {
  importTests('Users', './users/users.test.ts');
  importTests('Trips', './trips/trips.test.ts');
});
