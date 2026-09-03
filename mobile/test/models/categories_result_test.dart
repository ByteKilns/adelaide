import 'package:flutter_test/flutter_test.dart';
import 'package:piko/models/categories_result.dart';

void main() {
  test('CategoriesResult.fromJson parses categories and members', () {
    final result = CategoriesResult.fromJson({
      'categories': [
        {'id': 'cat-1', 'name': 'Groceries'},
        {'id': 'cat-2', 'name': 'Transport'},
      ],
      'members': [
        {'id': 'mem-1', 'name': 'Nirjal'},
        {'id': 'mem-2', 'name': 'Karuna'},
      ],
    });

    expect(result.categories, hasLength(2));
    expect(result.categories.first.id, 'cat-1');
    expect(result.categories.first.name, 'Groceries');
    expect(result.members, hasLength(2));
    expect(result.members.last.name, 'Karuna');
  });
}
