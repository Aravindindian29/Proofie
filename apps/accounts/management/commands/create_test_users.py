from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Create test users with different roles for workflow testing'

    def handle(self, *args, **kwargs):
        users_data = [
            {
                'username': 'Poorna',
                'first_name': 'Poorna',
                'last_name': 'Mala',
                'email': 'poorna@test.com',
                'password': 'Chennai-1234',
                'role': 'lite_user'
            },
            {
                'username': 'Murali',
                'first_name': 'Murali',
                'last_name': 'Krishna',
                'email': 'murali@test.com',
                'password': 'Chennai-1234',
                'role': 'approver'
            },
            {
                'username': 'Raj',
                'first_name': 'Raj',
                'last_name': 'Kumar',
                'email': 'raj@test.com',
                'password': 'Chennai-1234',
                'role': 'manager'
            },
            {
                'username': 'Ashok',
                'first_name': 'Ashok',
                'last_name': 'Kumar',
                'email': 'ashok@test.com',
                'password': 'Chennai-1234',
                'role': 'lite_user'
            },
            {
                'username': 'Ganpat',
                'first_name': 'Ganpat',
                'last_name': 'Patel',
                'email': 'ganpat@test.com',
                'password': 'Chennai-1234',
                'role': 'approver'
            },
            {
                'username': 'Prateeksha',
                'first_name': 'Prateeksha',
                'last_name': 'Parihar',
                'email': 'prateeksha@test.com',
                'password': 'Chennai-1234',
                'role': 'manager'
            },
        ]

        for user_data in users_data:
            username = user_data['username']
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'User {username} already exists, updating role...')
                )
                user = User.objects.get(username=username)
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.role = user_data['role']
                profile.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated {username} role to {user_data["role"]}')
                )
            else:
                # Create new user
                user = User.objects.create_user(
                    username=username,
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name']
                )
                
                # Create or update profile with role
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.role = user_data['role']
                profile.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created user {username} ({user_data["first_name"]} {user_data["last_name"]}) '
                        f'with role: {user_data["role"]}'
                    )
                )

        self.stdout.write(self.style.SUCCESS('\n✅ All test users created/updated successfully!'))
        self.stdout.write(self.style.SUCCESS('\nUser Summary:'))
        self.stdout.write(self.style.SUCCESS('- Lite Users: Poorna, Ashok'))
        self.stdout.write(self.style.SUCCESS('- Approvers: Murali, Ganpat'))
        self.stdout.write(self.style.SUCCESS('- Managers: Raj, Prateeksha'))
        self.stdout.write(self.style.SUCCESS('\nPassword for all users: Chennai-1234'))
