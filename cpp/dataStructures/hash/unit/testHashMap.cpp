#include "stdinc.h"
#include "Hash.h"
#include "HashMap.h"
#include "Util.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 20;
	HashMap<int,int,Hash::s32> map1(n);

        Utest::assertEqual(map1.put(1234,543,3),3,
		"wrong index for first item");
        Utest::assertEqual(map1.getKey(3),1234,
		"wrong key for first item");
        Utest::assertEqual(map1.getValue(3),543,
		"wrong value for first item");
        Utest::assertEqual(map1.find(1234),3,
		"wrong index for first item");
	cout << "first map = " << map1 << endl;

        Utest::assertEqual(map1.put(3456,987,8),8,
		"wrong index for second item");
        Utest::assertEqual(map1.getKey(8),3456,
		"wrong key for second item");
        Utest::assertEqual(map1.getValue(8),987,
		"wrong value for second item");
        Utest::assertEqual(map1.find(3456),8,
		"wrong index for second item");
	cout << "next map = " << map1 << endl;

        Utest::assertEqual(map1.put(78,87,2),2,
		"wrong index for third item");
        Utest::assertEqual(map1.getKey(2),78,
		"wrong key for third item");
        Utest::assertEqual(map1.getValue(2),87,
		"wrong value for third item");
        Utest::assertEqual(map1.find(78),2,
		"wrong index for third item");
        Utest::assertEqual(map1.toString(),
		"{(1234,543) (3456,987) (78,87)}",
		"mismatched map");

	Utest::assertEqual(map1.size(),3,"size mismatch");
	map1.remove(3456);
        Utest::assertEqual(map1.toString(),
		"{(1234,543) (78,87)}",
		"mismatched map");

	map1.put(78,27);
        Utest::assertEqual(map1.toString(),
		"{(1234,543) (78,27)}",
		"mismatched map");
	uint32_t x = map1.find(1234);
	int& v = map1.getValue(x);
	v = 985;
        Utest::assertEqual(map1.toString(),
		"{(1234,985) (78,27)}", "mismatched map");
	int& v2 = map1.get(78);
	v2 = 33;
        Utest::assertEqual(map1.toString(),
		"{(1234,985) (78,33)}", "mismatched map");

	for (int i = 100; i < 200; i++) map1.put(i,i+100);
	for (int i = 100; i < 200; i++)
		Utest::assertEqual(map1.get(i),i+100,
			"get mismatch " + to_string(i));
	map1.put(300,301,500);
	Utest::assertEqual(map1.n(),500,"size mismatch (500)");
	Utest::assertEqual(map1.find(300),500,"find mismatch (300)");
	Utest::assertEqual(map1.find(400),0,"find mismatch (400)");
	map1.clear();
	Utest::assertEqual(map1.n(),10,"size mismatch (10)");


	HashMap<string,string,Hash::string> map2(n);

        Utest::assertEqual(map2.put("abc","uvw",3),3,
		"wrong index for first item");
        Utest::assertEqual(map2.getKey(3),"abc",
		"wrong key for first item");
        Utest::assertEqual(map2.getValue(3),"uvw",
		"wrong value for first item");
        Utest::assertEqual(map2.find("abc"),3,
		"wrong index for first item");
	cout << "first map = " << map2 << endl;

        Utest::assertEqual(map2.put("bar","xyz",8),8,
		"wrong index for second item");
        Utest::assertEqual(map2.getKey(8),"bar",
		"wrong key for second item");
        Utest::assertEqual(map2.getValue(8),"xyz",
		"wrong value for second item");
        Utest::assertEqual(map2.find("bar"),8,
		"wrong index for second item");
	cout << "next map = " << map2 << endl;

        Utest::assertEqual(map2.put("lmn","pqrs",2),2,
		"wrong index for third item");
        Utest::assertEqual(map2.getKey(2),"lmn",
		"wrong key for third item");
        Utest::assertEqual(map2.getValue(2),"pqrs",
		"wrong value for third item");
        Utest::assertEqual(map2.find("lmn"),2,
		"wrong index for third item");
        Utest::assertEqual(map2.toString(),
		"{(abc,uvw) (bar,xyz) (lmn,pqrs)}",
		"mismatched map");

	Utest::assertEqual(map2.size(),3,"size mismatch");
	map2.remove("bar");
        Utest::assertEqual(map2.toString(),
		"{(abc,uvw) (lmn,pqrs)}",
		"mismatched map");

	map2.put("lmn","foo");
        Utest::assertEqual(map2.toString(),
		"{(abc,uvw) (lmn,foo)}",
		"mismatched map");
	x = map2.find("abc");
	string& v3 = map2.getValue(x);
	v3 = "who";
        Utest::assertEqual(map2.toString(),
		"{(abc,who) (lmn,foo)}", "mismatched map");
	string& v4 = map2.get("lmn");
	v4 = "hah";
        Utest::assertEqual(map2.toString(),
		"{(abc,who) (lmn,hah)}", "mismatched map");
	cout << "basic tests passed\n";
}


int main() {
	basicTests();
}
