# ruby java_test_explorer.rb selftest
# Test the library
# ruby java_test_explorer.rb /home/user/eclipse_workspace/TestJavaProject
# List all the JUnit test cases in the project TestJavaProject
require 'find'

$separator = "-" * 50

def toCamelNotation(name)
  words = name.split("_")
  words.shift + words.map{|x| x.capitalize}.join("")
end

def camelNotationToHumanReadable(name)
  name.scan(/[A-Z]?[^A-Z]+/).map{|word| word.downcase}.join(" ").capitalize
end

def listCases(projectDirectory)
  Find.find(projectDirectory) do |filePath| 
    if !File.directory?(filePath) && File.extname(filePath).eql?(".java")
      File.open(filePath, "r") do |f|
	testNamePrinted = false
	f.read.scan(/@Test[\t ]*\n[\t ]*public void (.*)\(/) do |testCase|
	  if !testNamePrinted
	    puts $separator
            puts camelNotationToHumanReadable(File.basename(filePath, ".java"))
            puts $separator
	    testNamePrinted = true
	  end
	  puts camelNotationToHumanReadable(toCamelNotation(testCase[0]))
	end
      end
    end
  end
end

if ARGV[0].eql?("selftest")
  require 'test/unit'

  class ToCamelNotationTest < Test::Unit::TestCase
 
    def test_one_component
      assert_equal("one", toCamelNotation("one"))
    end
  
    def test_few_components_separated_by_underscore
      assert_equal("oneTwoThree", toCamelNotation("one_two_three"))
    end
 
     def test_few_components_separated_by_few_undescores
       assert_equal("oneTwoThree", toCamelNotation("one__two__three"))
     end
  end

  class CamelNotationToHumanReadableTest < Test::Unit::TestCase
    
      def test_one_component
         assert_equal("One", camelNotationToHumanReadable("one"))
      end
    
      def test_few_components
        assert_equal("One two three", camelNotationToHumanReadable("oneTwoThree"))
      end
  end
else 
  listCases(ARGV[0] || ".")
end