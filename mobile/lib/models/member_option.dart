class MemberOption {
  final String id;
  final String name;

  MemberOption({required this.id, required this.name});

  factory MemberOption.fromJson(Map<String, dynamic> json) {
    return MemberOption(id: json['id'] as String, name: json['name'] as String);
  }
}
