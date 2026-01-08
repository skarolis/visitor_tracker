import os
import sys
from streamlit.web import cli as stcli

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    sys.argv = ["streamlit", "run", "visitor_app.py"]
    stcli.main()
