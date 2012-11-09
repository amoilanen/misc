require "test/unit"

def fromBinaryCodes(text)
    text.split(" ").map{|symbol| symbol.to_i(2).chr}.join("")
end

def toBinaryCodes(text)
   text.split(//).map{|symbol| symbol.ord.to_s(2)}.join(" ")
end
 
class TestBinaryCodes < Test::Unit::TestCase
 
  def test_fromBinaryCodes
    assert_equal("abc", fromBinaryCodes("1100001 1100010 1100011"))
  end
 
  def test_toBinaryCodes
     assert_equal("1100001 1100010 1100011", toBinaryCodes("abc"))
  end
end