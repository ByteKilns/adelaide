import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:piko/theme/category_style.dart';

void main() {
  group('styleFor', () {
    test('matches a keyword case-insensitively', () {
      final lower = styleFor('groceries');
      final mixed = styleFor('Groceries');
      expect(lower.icon, Icons.local_grocery_store);
      expect(mixed.icon, Icons.local_grocery_store);
    });

    test('falls back to the default icon for an unmatched category name', () {
      final style = styleFor('Miscellaneous');
      expect(style.icon, Icons.category);
    });

    test('returns the same icon and colors for the same category name across calls', () {
      final a = styleFor('Transportation');
      final b = styleFor('Transportation');
      expect(a.icon, b.icon);
      expect(a.background, b.background);
      expect(a.foreground, b.foreground);
    });

    test('returns a background/foreground pair from the fixed palette', () {
      final style = styleFor('Anything');
      expect(style.background, isA<Color>());
      expect(style.foreground, isA<Color>());
    });
  });
}
