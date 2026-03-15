# Author: Bria Tran
# Date: Feburary 4th, 2026
#
# NOTE: This code is still in progress
# These files/logic are for how the system COULD work once fully implemented
# 
# Handles automatic linking of evidence files
# Right now it just finds duplicate files (same hash) and connects them
# Could add more auto-linking logic later like matching by metadata

from backend.services.database import get_db_connection
from services.graph_service import create_evidence_link

# automatically links files that are duplicates
# useful when someone uploads the same photo multiple times
def auto_link_duplicates(case_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # find groups of files with the same checksum
        # HAVING COUNT(*) > 1 means only get checksums that appear more than once
        query = "SELECT ChecksumSha256 FROM Evidence WHERE case_id = ? GROUP BY ChecksumSha256 HAVING COUNT(*) > 1"
        cursor.execute(query, (case_id,))
        duplicates = cursor.fetchall()

        # for each duplicate group, link them together
        for dup in duplicates:
            # get all file IDs with this checksum
            cursor.execute("SELECT FileId FROM Evidence WHERE ChecksumSha256 = ?", (dup[0],))
            ids = [row[0] for row in cursor.fetchall()]
            
            # use first one as primary and link the rest to it
            primary = ids[0]
            for other in ids[1:]:
                # create the actual link in the graph
                create_evidence_link(primary, other, "Auto-Link: Duplicate Content")
        return True
    except Exception as e:
        print(f"Bulk Link Error: {e}")
        return False
    finally:
        conn.close()
