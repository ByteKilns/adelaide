class CategoryOption {
  final String id;
  final String name;

  CategoryOption({required this.id, required this.name});

  factory CategoryOption.fromJson(Map<String, dynamic> json) {
    return CategoryOption(id: json['id'] as String, name: json['name'] as String);
  }
}
