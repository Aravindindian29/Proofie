from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile


class Command(BaseCommand):
    help = 'Create Saranya user with Manager role'

    def handle(self, *args, **kwargs):
        username = 'Saranya'
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'User {username} already exists, updating role...')
            )
            user = User.objects.get(username=username)
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = 'manager'
            profile.save()
            self.stdout.write(
                self.style.SUCCESS(f'Updated {username} role to manager')
            )
        else:
            # Create new user
            user = User.objects.create_user(
                username='Saranya',
                email='saranyas@applieddatafinance.com',
                password='Chennai-1234',
                first_name='Saranya',
                last_name='S'
            )
            
            # Create profile with manager role
            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.role = 'manager'
            profile.save()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created user Saranya (Saranya S) with role: manager'
                )
            )

        self.stdout.write(self.style.SUCCESS('\n✅ Saranya user created/updated successfully!'))
        self.stdout.write(self.style.SUCCESS('Username: Saranya'))
        self.stdout.write(self.style.SUCCESS('Password: Chennai-1234'))
        self.stdout.write(self.style.SUCCESS('Role: Manager'))
