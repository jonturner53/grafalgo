IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 

%.o : %.cpp
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : testList testList_d testDjsets_cl testListPair testDjsets_flt \
	testList_g

testList: testList.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testList_d: testList_d.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testList_g: testList_g.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testStack: testStack.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDjsets_cl: testDjsets_cl.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testListPair: testListPair.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

testDjsets_flt: testDjsets_flt.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean :
	rm -f *.o
