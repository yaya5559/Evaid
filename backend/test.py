from .services.evidence.signal_pipline import run_universal_extraction
import re
from dataclasses import dataclass
from typing import List, Dict, Any
from unittest.mock import MagicMock, patch

class TestRunUniversalExtraction:
    
    def setup_method(self):
        """Setup before each test"""
        self.passed = 0
        self.failed = 0
    
    def assert_equal(self, actual, expected, message=""):
        """Simple assertion helper"""
        if actual == expected:
            self.passed += 1
            print(f"✓ PASS: {message}")
        else:
            self.failed += 1
            print(f"✗ FAIL: {message}")
            print(f"  Expected: {expected}")
            print(f"  Got: {actual}")
    
    def assert_true(self, condition, message=""):
        """Assert condition is true"""
        if condition:
            self.passed += 1
            print(f"✓ PASS: {message}")
        else:
            self.failed += 1
            print(f"✗ FAIL: {message}")
    
    def test_single_pattern_match(self):
        """Test extraction with one signal type matching once"""
        print("\n--- Test: Single Pattern Match ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Contact me at john@example.com"
            attachment_id = "doc-123"
            
            results = run_universal_extraction(markdown, attachment_id)
            
            self.assert_equal(len(results), 1, "Should find 1 email")
            self.assert_equal(results[0].signal_type, "email", "Signal type should be email")
            self.assert_equal(results[0].raw_value, "john@example.com", "Raw value correct")
            self.assert_equal(results[0].confidence, 0.95, "Confidence should be 0.95")
    
    def test_multiple_matches_same_pattern(self):
        """Test extraction with multiple matches of the same pattern"""
        print("\n--- Test: Multiple Matches Same Pattern ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("phone", r"\b\d{3}-\d{3}-\d{4}\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Call 555-123-4567 or 555-987-6543"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 2, "Should find 2 phone numbers")
            self.assert_equal(results[0].raw_value, "555-123-4567", "First phone correct")
            self.assert_equal(results[1].raw_value, "555-987-6543", "Second phone correct")
    
    def test_multiple_pattern_types(self):
        """Test extraction with multiple signal types"""
        print("\n--- Test: Multiple Pattern Types ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
            ("phone", r"\b\d{3}-\d{3}-\d{4}\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Email: test@example.com Phone: 555-123-4567"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 2, "Should find 2 signals")
            self.assert_equal(results[0].signal_type, "email", "First signal is email")
            self.assert_equal(results[1].signal_type, "phone", "Second signal is phone")
    
    def test_case_insensitive_matching(self):
        """Test that regex matching is case-insensitive"""
        print("\n--- Test: Case Insensitive Matching ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("protocol", r"(http|https|ftp)")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Visit HTTPS://example.com or Http://test.com"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 2, "Should find 2 protocols")
    
    def test_normalized_value_lowercase(self):
        """Test that normalized values are lowercase"""
        print("\n--- Test: Normalized Value Lowercase ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("name", r"(John|Jane|Bob)")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "JOHN and JaNe"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 2, "Should find 2 names")
            self.assert_equal(results[0].normalized_value, "john", "JOHN normalized to john")
            self.assert_equal(results[1].normalized_value, "jane", "JaNe normalized to jane")
    
    def test_empty_markdown(self):
        """Test with empty markdown string"""
        print("\n--- Test: Empty Markdown ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            results = run_universal_extraction("", "doc-123")
            
            self.assert_equal(len(results), 0, "Empty markdown should return no results")
    
    def test_no_matches(self):
        """Test when pattern doesn't match anything"""
        print("\n--- Test: No Matches ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "No email addresses here"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 0, "No matches should return empty list")
    
    def test_no_patterns_in_database(self):
        """Test when database returns no patterns"""
        print("\n--- Test: No Patterns in Database ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Some content with email@example.com"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 0, "No patterns should return empty list")
    
    def test_source_locator_positions(self):
        """Test that source locator has correct char positions"""
        print("\n--- Test: Source Locator Positions ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Contact: john@example.com here"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 1, "Should find 1 email")
            self.assert_equal(results[0].source_locator["char_start"], 9, "Start position correct")
            self.assert_equal(results[0].source_locator["char_end"], 25, "End position correct")
            self.assert_equal(results[0].source_locator["method"], "regex", "Method should be regex")
    
    def test_attachment_id_in_source_locator(self):
        """Test that attachment_id is correctly stored"""
        print("\n--- Test: Attachment ID in Source Locator ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("test", r"test")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            attachment_id = "attach-789"
            results = run_universal_extraction("this is a test", attachment_id)
            
            self.assert_equal(len(results), 1, "Should find 1 match")
            self.assert_equal(results[0].source_locator["attachement_id"], "attach-789", "Attachment ID correct")
    
    def test_normalized_value_strips_whitespace(self):
        """Test that normalized values have whitespace stripped"""
        print("\n--- Test: Normalized Value Strips Whitespace ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("word", r"\b\w+\b")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "  TEST  "
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 1, "Should find 1 word")
            self.assert_equal(results[0].normalized_value, "test", "TEST normalized to test")
    
    def test_all_results_have_confidence(self):
        """Test that all results have confidence of 0.95"""
        print("\n--- Test: All Results Have Confidence ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("email", r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}"),
            ("phone", r"\d{3}-\d{3}-\d{4}")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Email: test@example.com Phone: 555-123-4567"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            for i, result in enumerate(results):
                self.assert_equal(result.confidence, 0.95, f"Result {i} confidence is 0.95")
    
    def test_database_connection_closed(self):
        """Test that database connection is properly closed"""
        print("\n--- Test: Database Connection Closed ---")
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        mock_conn.cursor.return_value = mock_cursor
        
        with patch('__main__.get_db_connection', return_value=mock_conn):
            run_universal_extraction("test", "doc-123")
            
            self.assert_true(mock_conn.close.called, "Database connection should be closed")
    
    def test_overlapping_pattern_matches(self):
        """Test handling of patterns that could overlap"""
        print("\n--- Test: Overlapping Pattern Matches ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("ipv4", r"\d+\.\d+\.\d+\.\d+")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "IP: 192.168.1.1 and 10.0.0.1"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 2, "Should find 2 IP addresses")
            self.assert_equal(results[0].raw_value, "192.168.1.1", "First IP correct")
            self.assert_equal(results[1].raw_value, "10.0.0.1", "Second IP correct")
    
    def test_special_characters_in_markdown(self):
        """Test extraction with special characters in content"""
        print("\n--- Test: Special Characters in Markdown ---")
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [
            ("url", r"https?://[^\s]+")
        ]
        
        with patch('__main__.get_db_connection') as mock_conn:
            mock_conn.return_value.cursor.return_value = mock_cursor
            
            markdown = "Visit https://example.com/path?param=value&other=123"
            
            results = run_universal_extraction(markdown, "doc-123")
            
            self.assert_equal(len(results), 1, "Should find 1 URL")
            self.assert_true("https://" in results[0].raw_value, "URL contains https://")
    
    def run_all_tests(self):
        """Run all tests and print summary"""
        print("=" * 60)
        print("RUNNING UNIVERSAL EXTRACTION TESTS")
        print("=" * 60)
        
        test_methods = [
            self.test_single_pattern_match,
            self.test_multiple_matches_same_pattern,
            self.test_multiple_pattern_types,
            self.test_case_insensitive_matching,
            self.test_normalized_value_lowercase,
            self.test_empty_markdown,
            self.test_no_matches,
            self.test_no_patterns_in_database,
            self.test_source_locator_positions,
            self.test_attachment_id_in_source_locator,
            self.test_normalized_value_strips_whitespace,
            self.test_all_results_have_confidence,
            self.test_database_connection_closed,
            self.test_overlapping_pattern_matches,
            self.test_special_characters_in_markdown,
        ]
        
        for test_method in test_methods:
            self.setup_method()
            try:
                test_method()
            except Exception as e:
                self.failed += 1
                print(f"✗ EXCEPTION: {str(e)}")
        
        print("\n" + "=" * 60)
        print(f"TOTAL PASSED: {self.passed}")
        print(f"TOTAL FAILED: {self.failed}")
        print("=" * 60)


if __name__ == "__main__":
    tester = TestRunUniversalExtraction()
    tester.run_all_tests()