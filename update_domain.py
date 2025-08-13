#!/usr/bin/env python3
"""
Скрипт для обновления домена в файлах проекта
Использование: python update_domain.py YOUR_RAILWAY_DOMAIN
"""

import sys
import re
import os

def update_domain_in_file(file_path, old_domain, new_domain):
    """Обновляет домен в указанном файле"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Заменяем домен
        updated_content = content.replace(old_domain, new_domain)
        
        if content != updated_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Обновлен {file_path}")
            return True
        else:
            print(f"ℹ️  {file_path} - изменений не найдено")
            return False
    except Exception as e:
        print(f"❌ Ошибка при обновлении {file_path}: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Использование: python update_domain.py YOUR_RAILWAY_DOMAIN")
        print("Пример: python update_domain.py my-app.railway.app")
        sys.exit(1)
    
    new_domain = sys.argv[1]
    old_domain = "goatmusic.ru"
    
    print(f"🔄 Обновляю домен с {old_domain} на {new_domain}")
    print()
    
    # Файлы для обновления
    files_to_update = [
        "script.js",
        "config.js"
    ]
    
    updated_count = 0
    for file_path in files_to_update:
        if os.path.exists(file_path):
            if update_domain_in_file(file_path, old_domain, new_domain):
                updated_count += 1
        else:
            print(f"⚠️  Файл {file_path} не найден")
    
    print()
    if updated_count > 0:
        print(f"🎉 Обновлено {updated_count} файлов!")
        print(f"🌐 Теперь используйте домен: {new_domain}")
    else:
        print("ℹ️  Изменений не найдено")

if __name__ == "__main__":
    main()
