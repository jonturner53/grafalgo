#include "stdinc.h"
#include "Hash.h"
#include "HashMap.h"
#include "Util.h"
#include "Utest.h"

using namespace grafalgo;

void basicTests() {
	int n = 20;
	HashMap<int,int,Hash::s32> map1(n);

        chekExpr(map1, map1.put(1234,543,3), "a1 map1.put(1234,543,3)", 3);
        chekExpr(map1, map1.getKey(3), "a2 map1.getKey(3)", 1234);
        chekExpr(map1, map1.getValue(3), "a3 map1.getValue(3)", 543);
        chekExpr(map1, map1.find(1234), "a4 map1.find(1234)", 3);
	chekState(map1, "a5", "{(1234,543)}");

        chekExpr(map1, map1.put(3456,987,8), "b1 map1.put(3456,987,8)", 8);
        chekExpr(map1, map1.getKey(8), "b2 map1.getKey(8)", 3456);
        chekExpr(map1, map1.getValue(8), "b3 map1.getKey(8)", 987);
        chekExpr(map1, map1.find(3456), "b4 map1.find(3456)", 8);
	chekState(map1, "b5", "{(1234,543) (3456,987)}");

        chekExpr(map1, map1.put(78,87,2), "c1 map1.put(78,87,2)", 2);
        chekExpr(map1, map1.getKey(2), "c2 map1.getKey(2)", 78);
        chekExpr(map1, map1.getValue(2), "c3 map1.getKey(2)", 87);
        chekExpr(map1, map1.find(78), "c4 map1.find(78)", 2);
	chekState(map1, "c5", "{(1234,543) (3456,987) (78,87)}");

        chekExpr(map1, map1.size(), "d1 map1.size()", 3);
	map1.remove(3456);
	chekState(map1, "d2", "{(1234,543) (78,87)}");
	map1.put(78,27);
	chekState(map1, "d3", "{(1234,543) (78,27)}");
	uint32_t x = map1.find(1234);
	int& v = map1.getValue(x);
	v = 985;
	chekState(map1, "d4", "{(1234,985) (78,27)}");
	int& v2 = map1.get(78);
	v2 = 33;
	chekState(map1, "d5", "{(1234,985) (78,33)}");

	for (int i = 100; i < 200; i++) map1.put(i,i+100);
	for (int i = 100; i < 200; i++)
		chekExpr(map1, map1.get(i),
			 "e" + to_string(i) + " map1.get(i)", i+100);

	map1.put(300,301,500);
	chekExpr(map1, map1.n(), "f1 map1.n()", 500);
	chekExpr(map1, map1.find(300), "f2 map1.find(300)", 500);
	chekExpr(map1, map1.find(400), "f3 map1.find(400)", 0);
	map1.clear();
	chekExpr(map1, map1.n(), "f4 map1.n()", 10);

	HashMap<string,string,Hash::string> map2(n);

        chekExpr(map2, map2.put("abc","uvw",3),
			    "g1 map2.put(\"abc\",\"uvw\",3)", 3);
        chekExpr(map2, map2.getKey(3)=="abc", "g2 map2.getKey(3)", true);
        chekExpr(map2, map2.getValue(3)=="uvw", "g3 map2.getKey(3)", true);
        chekExpr(map2, map2.find("abc"), "g4 map2.find(\"abc\")", 3);
	chekState(map2, "g5", "{(abc,uvw)}");

        chekExpr(map2, map2.put("bar","xyz",8),
			    "h1 map2.put(\"bar\",\"xyz\",8)", 8);
        chekExpr(map2, map2.getKey(8)=="bar", "h2 map2.getKey(8)", true);
        chekExpr(map2, map2.getValue(8)=="xyz", "h3 map2.getKey(8)", true);
        chekExpr(map2, map2.find("bar"), "h4 map2.find(\"bar\")", 8);
	chekState(map2, "h5", "{(abc,uvw) (bar,xyz)}");

        chekExpr(map2, map2.put("lmn","pqrs",2),
			    "i1 map2.put(\"lmn\",\"pqrs\",2)", 2);
        chekExpr(map2, map2.getKey(2)=="lmn", "i2 map2.getKey(2)", true);
        chekExpr(map2, map2.getValue(2)=="pqrs", "i3 map2.getKey(2)", true);
        chekExpr(map2, map2.find("lmn"), "i4 map2.find(\"bar\")", 2);
	chekState(map2, "i5", "{(abc,uvw) (bar,xyz) (lmn,pqrs)}");

        chekExpr(map2, map2.size(), "j1 map2.size()", 3);
	map2.remove("bar");
	chekState(map2, "j2", "{(abc,uvw) (lmn,pqrs)}");
	map2.put("lmn","foo");
	chekState(map2, "j3", "{(abc,uvw) (lmn,foo)}");
	x = map2.find("abc");
	string& v3 = map2.getValue(x);
	v3 = "who";
	chekState(map2, "j4", "{(abc,who) (lmn,foo)}");
	string& v4 = map2.get("lmn");
	v4 = "hah";
	chekState(map2, "j5", "{(abc,who) (lmn,hah)}");
}


int main() {
	cout << "testing\n";
	basicTests();
	cout << "passed\n";
}
