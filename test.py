import scgms_wrapper  # Importuj váš C++ modul


# Vypiš výsledek
print(f"Is scgms lib loaded: {scgms_wrapper.load_scgms_lib()}")
print(f"Available filters: {scgms_wrapper.list_available_filters()}")

