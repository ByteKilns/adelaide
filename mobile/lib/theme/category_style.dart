import 'package:flutter/material.dart';

class CategoryStyle {
  final IconData icon;
  final Color background;
  final Color foreground;

  const CategoryStyle({required this.icon, required this.background, required this.foreground});
}

const _palette = [
  (background: Color(0xFFF3E8FF), foreground: Color(0xFF7C3AED)),
  (background: Color(0xFFFCE7F3), foreground: Color(0xFFDB2777)),
  (background: Color(0xFFDBEAFE), foreground: Color(0xFF2563EB)),
  (background: Color(0xFFDCFCE7), foreground: Color(0xFF16A34A)),
  (background: Color(0xFFFFEDD5), foreground: Color(0xFFEA580C)),
];

const _keywordIcons = <String, IconData>{
  'food': Icons.restaurant,
  'lunch': Icons.restaurant,
  'dinner': Icons.restaurant,
  'breakfast': Icons.restaurant,
  'grocery': Icons.local_grocery_store,
  'groceries': Icons.local_grocery_store,
  'transport': Icons.directions_car,
  'petrol': Icons.local_gas_station,
  'fuel': Icons.local_gas_station,
  'car': Icons.directions_car,
  'shop': Icons.shopping_bag,
  'cloth': Icons.shopping_bag,
  'cosmetic': Icons.shopping_bag,
  'medic': Icons.medical_services,
  'health': Icons.medical_services,
  'pharmacy': Icons.medical_services,
  'mobile': Icons.phone_iphone,
  'phone': Icons.phone_iphone,
  'internet': Icons.wifi,
  'bill': Icons.receipt_long,
  'rent': Icons.home,
  'date': Icons.favorite,
  'gift': Icons.card_giftcard,
  'travel': Icons.flight,
  'entertainment': Icons.movie,
};

const _defaultIcon = Icons.category;

IconData _iconFor(String categoryName) {
  final lower = categoryName.toLowerCase();
  for (final entry in _keywordIcons.entries) {
    if (lower.contains(entry.key)) return entry.value;
  }
  return _defaultIcon;
}

CategoryStyle styleFor(String categoryName) {
  final icon = _iconFor(categoryName);
  // Dart's `%` on int always returns a non-negative result when the divisor
  // is positive, so this is safe for any hashCode without needing `.abs()`.
  final index = categoryName.hashCode % _palette.length;
  final colors = _palette[index];
  return CategoryStyle(icon: icon, background: colors.background, foreground: colors.foreground);
}
